"""
Authentication URL patterns
All served under /api/auth/
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # ── Core auth ──────────────────────────────────────────────
    path('login/',           views.login_view,           name='auth_login'),
    path('logout/',          views.logout_view,          name='auth_logout'),
    path('refresh/',         TokenRefreshView.as_view(), name='auth_refresh'),
    path('me/',              views.me,                   name='auth_me'),

    # ── First-login forced change ───────────────────────────────
    path('password-change/', views.force_change_password, name='auth_password_change'),
    path('change-password/', views.force_change_password, name='auth_change_password'),  # alias

    # ── Voluntary change ────────────────────────────────────────
    path('change-password-voluntary/', views.change_password_view, name='auth_voluntary_change'),

    # ── Forgot / OTP reset ──────────────────────────────────────
    path('forgot-password/', views.forgot_password, name='auth_forgot'),
    path('verify-otp/',      views.verify_otp,      name='auth_verify_otp'),
    path('reset-password/',  views.reset_password,  name='auth_reset'),
]