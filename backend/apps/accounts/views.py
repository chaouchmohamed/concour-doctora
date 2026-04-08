from django.contrib.auth import get_user_model
from rest_framework import mixins, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

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


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = RefreshToken(serializer.validated_data["refresh"])
        token.blacklist()

        return Response({"detail": "Logged out."})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


class InviteUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        serializer = InviteUserSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        payload = serializer.save()
        return Response(
            {
                "user": UserSerializer(payload["user"]).data,
                "invite_link": payload["invite_link"],
            },
            status=201,
        )


class SetPasswordFromInviteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SetPasswordFromInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
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
