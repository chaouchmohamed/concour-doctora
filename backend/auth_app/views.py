"""
Authentication Views — merged:
  • Teammate's login/logout/force_change_password structure
  • Our OTP-based forgot/verify/reset password system
"""
import random
import string
from datetime import timedelta

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings

from auth_app.models import UserProfile, OTPToken
from auth_app.serializers import (
    LoginSerializer, UserSerializer, ForcePasswordChangeSerializer
)
from utils.audit import log_action

# ─── Constants ────────────────────────────────────────────────────────────────

OTP_EXPIRY_MINUTES = 2   # matches the 120-second frontend countdown

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _generate_otp(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))


def _issue_tokens(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token), str(refresh)


def _send_otp_email(email: str, code: str, first_name: str = '') -> bool:
    greeting = f"Hello{' ' + first_name if first_name else ''},"
    subject  = "Your ConcoursDoctor password-reset code"
    body = (
        f"{greeting}\n\n"
        f"Your one-time password-reset code is:\n\n"
        f"    {code}\n\n"
        f"This code expires in {OTP_EXPIRY_MINUTES} minutes. "
        f"Do not share it with anyone.\n\n"
        f"If you did not request a password reset, ignore this email.\n\n"
        f"--- ConcoursDoctor Security Team"
    )
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@concours.dz'),
            recipient_list=[email],
            fail_silently=False,
        )
        return True
    except Exception as exc:
        print(f"\n{'='*60}")
        print(f"[OTP] To: {email}   Code: {code}")
        print(f"[OTP] Email send error: {exc}")
        print(f"{'='*60}\n")
        return False


# ─── Login ────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.validated_data

        if not user.is_active:
            return Response(
                {'error': 'Ce compte est désactivé.'},
                status=status.HTTP_403_FORBIDDEN
            )

        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        must_change = user.profile.must_change_password if hasattr(user, 'profile') else False

        refresh = RefreshToken.for_user(user)

        log_action(
            user=user,
            action='LOGIN',
            object_type='User',
            object_id=user.id,
            details={'role': user.profile.role if hasattr(user, 'profile') else 'UNKNOWN'},
            request=request
        )

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'must_change_password': must_change,
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Logout ───────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        token_blacklisted = False

        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
            token_blacklisted = True

        log_action(
            user=request.user,
            action='LOGOUT',
            object_type='Auth',
            details={'token_blacklisted': token_blacklisted},
            request=request
        )

        return Response({'success': 'Logged out successfully'}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': 'Invalid token or token already blacklisted.', 'details': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ─── Force password change (first login) ──────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def force_change_password(request):
    """
    Forces the user to set a new password on their very first login.
    Accepts: { new_password }  — frontend already validates the confirm match.
    Returns fresh JWT tokens so the session stays alive.
    """
    new_password = (request.data.get('new_password') or '').strip()

    if not new_password:
        return Response({'error': 'New password is required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    user.set_password(new_password)
    user.save()

    if hasattr(user, 'profile'):
        user.profile.must_change_password = False
        user.profile.save(update_fields=['must_change_password'])

    access, refresh = _issue_tokens(user)

    log_action(
        user=user,
        action='FORCE_PASSWORD_CHANGE',
        object_type='Auth',
        request=request
    )

    return Response({
        'success': 'Password updated successfully.',
        'access': access,
        'refresh': refresh,
        'user': UserSerializer(user).data,
    }, status=status.HTTP_200_OK)


# ─── Voluntary password change ────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """Voluntary password change — requires current password."""
    current_password = request.data.get('current_password')
    new_password     = request.data.get('new_password')

    if not current_password or not new_password:
        return Response({'error': 'Both current and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not request.user.check_password(current_password):
        return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

    request.user.set_password(new_password)
    request.user.save()

    access, refresh = _issue_tokens(request.user)

    log_action(user=request.user, action='UPDATE', object_type='Auth',
               details={'action': 'voluntary_change_password'}, request=request)

    return Response({
        'success': 'Password changed successfully.',
        'access': access,
        'refresh': refresh,
    })


# ─── Forgot password — Step 1: Send OTP ──────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Generate a 6-digit OTP, store it, and email it. Always returns 200."""
    email = (request.data.get('email') or '').strip().lower()

    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Invalidate all previous unused OTPs for this email
    OTPToken.objects.filter(email=email, is_used=False).update(is_used=True)

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({'success': 'If that email is registered, an OTP has been sent.'})

    code = _generate_otp()
    expires_at = timezone.now() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    OTPToken.objects.create(email=email, code=code, expires_at=expires_at)

    sent = _send_otp_email(email, code, first_name=user.first_name)

    log_action(user=user, action='UPDATE', object_type='Auth',
               details={'action': 'forgot_password', 'email_sent': sent}, request=request)

    return Response({'success': 'If that email is registered, an OTP has been sent.'})


# ─── Forgot password — Step 2: Verify OTP ────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """Verify OTP is valid (correct + unexpired + unused). Does NOT consume it."""
    email = (request.data.get('email') or '').strip().lower()
    code  = (request.data.get('otp')   or '').strip()

    if not email or not code:
        return Response({'error': 'Email and OTP code are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        token = OTPToken.objects.filter(email__iexact=email, code=code, is_used=False).latest('created_at')
    except OTPToken.DoesNotExist:
        return Response({'error': 'Invalid code. Please check and try again.'}, status=status.HTTP_400_BAD_REQUEST)

    if not token.is_valid():
        return Response({'error': 'This code has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'success': 'OTP verified successfully.'})


# ─── Forgot password — Step 3: Reset password ────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Consume OTP and set new password. Expects: { email, otp, new_password }"""
    email        = (request.data.get('email')        or '').strip().lower()
    code         = (request.data.get('otp')          or '').strip()
    new_password = (request.data.get('new_password') or '').strip()

    if not email or not code or not new_password:
        return Response({'error': 'Email, OTP, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        token = OTPToken.objects.filter(email__iexact=email, code=code, is_used=False).latest('created_at')
    except OTPToken.DoesNotExist:
        return Response({'error': 'Invalid or already-used code.'}, status=status.HTTP_400_BAD_REQUEST)

    if not token.is_valid():
        return Response({'error': 'This code has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({'error': 'No account found with this email.'}, status=status.HTTP_400_BAD_REQUEST)

    token.is_used = True
    token.save(update_fields=['is_used'])
    OTPToken.objects.filter(email__iexact=email, is_used=False).update(is_used=True)

    user.set_password(new_password)
    user.save()

    log_action(user=user, action='RESET_PASSWORD', object_type='Auth', request=request)

    return Response({'success': 'Password reset successfully. You can now sign in.'})


# ─── Me ───────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Return the current authenticated user's full profile."""
    return Response(UserSerializer(request.user).data)