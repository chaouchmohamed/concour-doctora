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
import uuid

from api.models import UserProfile, AuditLog
from api.serializers import UserSerializer
from utils.audit import log_action


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """User login - returns JWT tokens"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Please provide both username and password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Authenticate user
    user = authenticate(username=username, password=password)
    
    if user is not None:
        # Check if user is active
        if not user.is_active:
            return Response(
                {'error': 'Account is disabled'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Update last login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        # Get user data
        serializer = UserSerializer(user)
        
        # Log action
        log_action(
            user=user,
            action='LOGIN',
            object_type='Auth',
            details={'username': username},
            request=request
        )
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': serializer.data
        })
    else:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )


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
def register_view(request):
    """Register new user (admin only in production)"""
    # Check if registration is allowed
    if not settings.DEBUG:
        # In production, only admin can create users
        return Response(
            {'error': 'Registration is disabled. Contact administrator.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    role = request.data.get('role', 'CORRECTOR')
    
    if not email or not password:
        return Response(
            {'error': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user exists
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'User with this email already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Generate username from email
    username = email.split('@')[0]
    base_username = username
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1
    
    # Create user
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        is_active=True
    )
    
    # Create profile
    UserProfile.objects.create(
        user=user,
        role=role,
        phone=request.data.get('phone', '')
    )
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    # Log action
    log_action(
        user=user,
        action='CREATE',
        object_type='User',
        object_id=user.id,
        details={'email': email, 'role': role},
        request=request
    )
    
    serializer = UserSerializer(user)
    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': serializer.data
    }, status=status.HTTP_201_CREATED)


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