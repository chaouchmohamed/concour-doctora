from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from auth_app.models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializes the extended user profile (role, department, password status)."""
    class Meta:
        model = UserProfile
        fields = ['role', 'department', 'must_change_password', 'email_notifications']


class UserSerializer(serializers.ModelSerializer):
    """
    Serializes the base user data and includes the nested profile.
    Also exposes must_change_password at the top level for the frontend.
    """
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    must_change_password = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'is_active', 'date_joined', 'last_login',
            'must_change_password', 'profile'
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

    def get_must_change_password(self, obj):
        try:
            return bool(obj.profile.must_change_password)
        except Exception:
            return False


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            raise serializers.ValidationError("Please provide both username and password")

        user = authenticate(username=username, password=password)

        if user is not None:
            if not user.is_active:
                raise serializers.ValidationError("Account is disabled")
            return user
        else:
            raise serializers.ValidationError("Invalid credentials")


class ForcePasswordChangeSerializer(serializers.Serializer):
    new_password     = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        user = self.context['request'].user
        try:
            validate_password(data['new_password'], user)
        except ValidationError as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})

        return data