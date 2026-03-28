"""
Authentication URLs
"""
from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='auth_login'),
    path('logout/', views.logout_view, name='auth_logout'),
    path('register/', views.register_view, name='auth_register'),
    path('refresh/', views.refresh_token_view, name='auth_refresh'),
    path('forgot-password/', views.forgot_password, name='auth_forgot'),
    path('verify-otp/', views.verify_otp, name='auth_verify_otp'),
    path('reset-password/', views.reset_password, name='auth_reset'),
    path('change-password/', views.change_password_view, name='auth_change_password'),
    path('me/', views.me, name='auth_me'),
]