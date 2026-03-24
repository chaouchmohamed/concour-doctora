"""
Authentication URLs
"""
from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('auth/logout/', views.logout_view, name='api_logout'),
    path('auth/password-change/', views.force_change_password, name='api_password_change'),

    path('login/', views.login_view, name='auth_login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('forgot-password/', views.forgot_password, name='auth_forgot'),
    path('reset-password/', views.reset_password, name='auth_reset'),
    path('me/', views.me, name='auth_me'),
]