from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.audit.models import ActionType
from apps.audit.services import log_event

from .permissions import IsAdminRole
from .serializers import (
    CustomTokenObtainPairSerializer,
    InviteUserSerializer,
    LogoutSerializer,
    MeSerializer,
    SetPasswordFromInviteSerializer,
    UserSerializer,
)

User = get_user_model()


def _get_client_ip(request) -> str:
    x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "0.0.0.0")


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    @extend_schema(summary="JWT Login", responses={200: None})
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            email = request.data.get("email", "")
            user = User.objects.filter(email__iexact=email).first()
            if user:
                log_event(
                    user=user,
                    target=user,
                    action=ActionType.LOGIN,
                    ip_address=_get_client_ip(request),
                    details={"event": "USER_LOGIN", "email": user.email},
                )

        return response


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer

    @extend_schema(
        summary="Logout (blacklist refresh token)",
        request=LogoutSerializer,
        responses={200: None},
    )
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = RefreshToken(serializer.validated_data["refresh"])
        token.blacklist()

        log_event(
            user=request.user,
            target=request.user,
            action=ActionType.LOGOUT,
            ip_address=_get_client_ip(request),
            details={"event": "USER_LOGOUT", "email": request.user.email},
        )

        return Response({"detail": "Logged out."})


class MeView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MeSerializer

    @extend_schema(summary="Current user profile", responses={200: MeSerializer})
    def get(self, request):
        return Response(MeSerializer(request.user).data)


class InviteUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = InviteUserSerializer

    @extend_schema(
        summary="Invite a new user with a specified role",
        request=InviteUserSerializer,
        responses={201: None},
    )
    def post(self, request):
        serializer = InviteUserSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        payload = serializer.save()

        log_event(
            user=request.user,
            target=payload["user"],
            action=ActionType.CREATE,
            ip_address=_get_client_ip(request),
            details={
                "event": "USER_INVITED",
                "invited_email": payload["user"].email,
                "invited_role": payload["user"].role,
            },
        )

        return Response(
            {
                "user": UserSerializer(payload["user"]).data,
                "invite_link": payload["invite_link"],
            },
            status=201,
        )


class SetPasswordFromInviteView(APIView):
    permission_classes = [AllowAny]
    serializer_class = SetPasswordFromInviteSerializer

    @extend_schema(
        summary="Set password from invite token",
        description="Activates the user account after setting the password.",
        request=SetPasswordFromInviteSerializer,
        responses={200: None},
    )
    def post(self, request):
        serializer = SetPasswordFromInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        log_event(
            user=user,
            target=user,
            action=ActionType.UPDATE,
            ip_address=_get_client_ip(request),
            details={"event": "PASSWORD_SET_FROM_INVITE", "email": user.email},
        )

        return Response({"detail": "Password set successfully."})


class UserManagementViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = User.objects.all().order_by("id")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
