"""
Authentication Views — full OTP forgot-password flow + forced first-login change
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

from api.models import UserProfile, OTPToken
from api.serializers import UserSerializer
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
        # Always print to console so it is visible in development
        print(f"\n{'='*60}")
        print(f"[OTP] To: {email}   Code: {code}")
        print(f"[OTP] Email send error: {exc}")
        print(f"{'='*60}\n")
        return False


# ─── Login ────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'error': 'Please provide both username and password'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(username=username, password=password)

    if user is None:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return Response({'error': 'Account is disabled'}, status=status.HTTP_403_FORBIDDEN)

    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])

    access, refresh = _issue_tokens(user)

    log_action(user=user, action='LOGIN', object_type='Auth',
               details={'username': username}, request=request)

    return Response({'refresh': refresh, 'access': access, 'user': UserSerializer(user).data})


# ─── Logout ───────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            RefreshToken(refresh_token).blacklist()
        log_action(user=request.user, action='LOGOUT', object_type='Auth', request=request)
        return Response({'success': 'Logged out successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ─── Register ─────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    if not settings.DEBUG:
        return Response(
            {'error': 'Registration is disabled. Contact administrator.'},
            status=status.HTTP_403_FORBIDDEN
        )

    email      = request.data.get('email')
    password   = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name  = request.data.get('last_name', '')
    role       = request.data.get('role', 'CORRECTOR')

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'User with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    base = email.split('@')[0]
    username = base
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base}{counter}"
        counter += 1

    user = User.objects.create_user(
        username=username, email=email, password=password,
        first_name=first_name, last_name=last_name, is_active=True
    )
    UserProfile.objects.create(user=user, role=role, phone=request.data.get('phone', ''))

    access, refresh = _issue_tokens(user)
    log_action(user=user, action='CREATE', object_type='User', object_id=user.id,
               details={'email': email, 'role': role}, request=request)

    return Response({'refresh': refresh, 'access': access, 'user': UserSerializer(user).data},
                    status=status.HTTP_201_CREATED)


# ─── Refresh token ────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token_view(request):
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        refresh = RefreshToken(refresh_token)
        return Response({'access': str(refresh.access_token)})
    except Exception:
        return Response({'error': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)


# ─── Change password (first-login forced OR voluntary) ───────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    Forced first-login  -> no current_password needed (must_change_password=True).
    Voluntary change    -> current_password required.
    Returns fresh JWT tokens.
    """
    new_password     = request.data.get('new_password')
    current_password = request.data.get('current_password')

    if not new_password:
        return Response({'error': 'New password is required'}, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    is_forced = False
    try:
        is_forced = bool(user.profile.must_change_password)
    except Exception:
        pass

    if not is_forced:
        if not current_password:
            return Response({'error': 'Current password is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.check_password(current_password):
            return Response({'error': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    if is_forced:
        try:
            user.profile.must_change_password = False
            user.profile.save(update_fields=['must_change_password'])
        except Exception:
            pass

    access, refresh = _issue_tokens(user)

    log_action(user=user, action='UPDATE', object_type='Auth',
               details={'action': 'change_password', 'forced': is_forced}, request=request)

    return Response({'success': 'Password changed successfully', 'access': access, 'refresh': refresh})


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

    # Consume this token + invalidate any others
    token.is_used = True
    token.save(update_fields=['is_used'])
    OTPToken.objects.filter(email__iexact=email, is_used=False).update(is_used=True)

    user.set_password(new_password)
    user.save()

    log_action(user=user, action='UPDATE', object_type='Auth',
               details={'action': 'reset_password'}, request=request)

    return Response({'success': 'Password reset successfully. You can now sign in.'})


# ─── Verify OTP URL registration ─────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Return the current authenticated user's full profile."""
    return Response(UserSerializer(request.user).data)