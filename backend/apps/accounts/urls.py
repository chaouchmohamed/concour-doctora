from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    InviteUserView,
    LoginView,
    LogoutView,
    MeView,
    RefreshView,
    SetPasswordFromInviteView,
    UserManagementViewSet,
)

router = DefaultRouter()
router.register(r"users", UserManagementViewSet, basename="user-management")

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("invites/", InviteUserView.as_view(), name="auth-invite"),
    path("set-password/", SetPasswordFromInviteView.as_view(), name="auth-set-password"),
    path("", include(router.urls)),
]
