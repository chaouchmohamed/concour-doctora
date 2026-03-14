"""
Authentication Views
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
import jwt
from .serializers import LoginSerializer,UserSerializer
from api.models import UserProfile
from utils.audit import log_action
from rest_framework.authtoken.models import Token
#logn view is updateeeeeeeeed
@api_view(['POST'])
@permission_classes([AllowAny])
def login_api_view(request):

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

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'must_change_password': must_change,
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
# login view is updateeeeeeeeed

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """User logout - blacklist refresh token"""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        # Log action
        log_action(
            user=request.user,
            action='LOGOUT',
            object_type='Auth',
            request=request
        )
        
        return Response({'success': 'Logged out successfully'})
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token_view(request):
    """Refresh access token"""
    refresh_token = request.data.get('refresh')
    
    if not refresh_token:
        return Response(
            {'error': 'Refresh token required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        refresh = RefreshToken(refresh_token)
        return Response({
            'access': str(refresh.access_token)
        })
    except Exception as e:
        return Response(
            {'error': 'Invalid refresh token'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Send password reset email"""
    email = request.data.get('email')
    
    if not email:
        return Response(
            {'error': 'Email required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
        
        # Generate reset token (simple version - use proper token in production)
        token = jwt.encode(
            {'user_id': user.id, 'exp': timezone.now() + timezone.timedelta(hours=24)},
            settings.SECRET_KEY,
            algorithm='HS256'
        )
        
        # Send email
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        
        send_mail(
            subject='Password Reset Request',
            message=f'Click the link to reset your password: {reset_link}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        
        # Log action
        log_action(
            user=user,
            action='UPDATE',
            object_type='Auth',
            details={'action': 'forgot_password'},
            request=request
        )
        
        return Response({'success': 'Password reset email sent'})
        
    except User.DoesNotExist:
        # Don't reveal that user doesn't exist
        return Response({'success': 'If email exists, reset link sent'})


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password with token"""
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    if not token or not new_password:
        return Response(
            {'error': 'Token and new password required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Decode token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        user_id = payload.get('user_id')
        
        user = User.objects.get(id=user_id)
        user.set_password(new_password)
        user.save()
        
        # Log action
        log_action(
            user=user,
            action='UPDATE',
            object_type='Auth',
            details={'action': 'reset_password'},
            request=request
        )
        
        return Response({'success': 'Password reset successful'})
        
    except jwt.ExpiredSignatureError:
        return Response(
            {'error': 'Reset link expired'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except (jwt.InvalidTokenError, User.DoesNotExist):
        return Response(
            {'error': 'Invalid reset link'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Get current user info"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)