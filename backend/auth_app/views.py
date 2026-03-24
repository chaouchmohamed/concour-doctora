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
from .serializers import ForcePasswordChangeSerializer, LoginSerializer,UserSerializer
#from utils.audit import log_action
from rest_framework.authtoken.models import Token
#logn view is updateeeeeeeeed
from utils.audit import log_action
from .serializers import LoginSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError


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
        
        # Mise à jour de la date de dernière connexion
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        must_change = user.profile.must_change_password if hasattr(user, 'profile') else False

        # Génération des tokens JWT
        refresh = RefreshToken.for_user(user)

        # On enregistre l'action juste avant de renvoyer la réponse au client
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
        }, status=status.HTTP_200_OK)

    # Si les identifiants sont faux, on renvoie les erreurs du serializer
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
# login view is updateeeeeeeeed

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """User logout - blacklist refresh token"""
    try:
        refresh_token = request.data.get('refresh')
        token_blacklisted = False
        
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()  # Invalide le token pour qu'il ne soit plus utilisable
            token_blacklisted = True
        
        # On enregistre la déconnexion avec succès
        log_action(
            user=request.user,
            action='LOGOUT',
            object_type='Auth',
            details={'token_blacklisted': token_blacklisted},
            request=request
        )
        
        return Response({'success': 'Logged out successfully'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        # Si le token est invalide ou expiré, on atterrit ici
        return Response(
            {'error': 'Invalid token or token already blacklisted.', 'details': str(e)},
            status=status.HTTP_400_BAD_REQUEST
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
    """Reset password with token (Lien envoyé par email par exemple)"""
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
        
        # On valide la force du mot de passe
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            # Si le mot de passe est trop faible, on renvoie l'erreur
            return Response({'error': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
        
        # 2. On change le mot de passe
        user.set_password(new_password)
        user.save()
        
        # (puisqu'il vient de le faire lui-même)
        if hasattr(user, 'profile'):
            user.profile.must_change_password = False
            user.profile.save()
        
        # Log action (J'ai changé 'UPDATE' en 'RESET_PASSWORD' pour que tes logs soient plus précis)
        log_action(
            user=user,
            action='RESET_PASSWORD', 
            object_type='Auth',
            request=request
        )
        
        return Response({'success': 'Password reset successful'}, status=status.HTTP_200_OK)
        
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




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def force_change_password(request):
    """
    Force l'utilisateur à changer son mot de passe par défaut 
    lors de sa toute première connexion.
    """
    # ⚠️ TRÈS IMPORTANT : On passe "context={'request': request}" au serializer
    # pour qu'il puisse récupérer "request.user" et valider la force du mot de passe
    serializer = ForcePasswordChangeSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        user = request.user
        
        # Le serializer a déjà vérifié que les deux mots de passe correspondent
        # et qu'ils respectent les règles de sécurité de Django.
        new_password = serializer.validated_data['new_password']
        
        # 1. On applique le nouveau mot de passe
        user.set_password(new_password)
        user.save()
        
        # 2. On libère l'utilisateur de cette obligation pour ses futures connexions
        if hasattr(user, 'profile'):
            user.profile.must_change_password = False
            user.profile.save()
            
        # 3. On garde une trace indélébile de cette action
        log_action(
            user=user,
            action='FORCE_PASSWORD_CHANGE',
            object_type='Auth',
            request=request
        )
        
        return Response(
            {'success': 'Mot de passe mis à jour avec succès. Vous pouvez maintenant utiliser la plateforme.'}, 
            status=status.HTTP_200_OK
        )
        
    # Si le mot de passe est trop court, ou si "new_password" != "confirm_password"
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)