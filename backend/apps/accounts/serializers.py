from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import RoleChoices, UserInvite
from .services import build_invite_link, get_usable_invite, issue_user_invite
from .tasks import notify_admin_lockout_task, send_invite_email_task

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "role", "is_active"]
        read_only_fields = ["id", "is_active"]


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "role"]


class InviteUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=RoleChoices.choices)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        inviter = self.context["request"].user
        user = User.objects.create_user(
            email=validated_data["email"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role=validated_data["role"],
            invited_by=inviter,
            is_active=False,
        )
        payload = issue_user_invite(user=user, invited_by=inviter)
        invite_link = build_invite_link(payload.raw_token)

        # Async by default; can be made synchronous in tests.
        send_invite_email_task.delay(user.email, invite_link)

        return {"user": user, "invite_link": invite_link}


class SetPasswordFromInviteSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=12)

    def save(self, **kwargs):
        try:
            invite = get_usable_invite(self.validated_data["token"])
        except (ValueError, UserInvite.DoesNotExist):
            raise serializers.ValidationError({"token": "Invalid, expired, or used token."})
        user = invite.user

        user.set_password(self.validated_data["password"])
        user.is_active = True
        user.failed_login_attempts = 0
        user.locked_until = None
        user.save(update_fields=["password", "is_active", "failed_login_attempts", "locked_until", "updated_at"])

        invite.used_at = timezone.now()
        invite.save(update_fields=["used_at", "updated_at"])

        return user


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Implements lockout counters required by SRS (3 attempts => 15 min lock).
    Also embeds the user's role inside the JWT access token so the frontend
    can perform RBAC routing immediately without an extra /me/ request.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        return token

    def validate(self, attrs):
        email = attrs.get("email")
        user = User.objects.filter(email__iexact=email).first()

        if user and user.is_locked:
            raise AuthenticationFailed("Account is temporarily locked. Try again later.")

        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            if user:
                was_locked = user.is_locked
                user.register_failed_login()
                if user.is_locked and not was_locked:
                    notify_admin_lockout_task.delay(user.email)
            raise

        if user:
            user.clear_failed_logins()
            # Enrich the login response with identity + role for instant frontend RBAC.
            data["role"] = user.role
            data["email"] = user.email
            data["user_id"] = user.id

        return data
