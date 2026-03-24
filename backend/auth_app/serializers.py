from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError 
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Sérialise les données du profil étendu (rôle, département, statut du mot de passe).
    """
    class Meta:
        model = UserProfile
        fields = ['role', 'department', 'must_change_password', 'email_notifications']


class UserSerializer(serializers.ModelSerializer):
    """
    Sérialise les données de base de l'utilisateur, et inclut son profil imbriqué.
    """
    # On imbrique le profil pour que le frontend reçoive toutes les infos en une seule requête
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']

class LoginSerializer(serializers.Serializer):

    username = serializers.CharField() 
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            raise serializers.ValidationError("Please provide both username and password")

        user = authenticate(username=username, password=password)

        if user is not None:
            if not user.is_active:
                raise serializers.ValidationError("Account is disabled")
            
            return user 
        else:
            raise serializers.ValidationError("Invalid credentials")
        

# Serializer for forcing password change on first login        
class ForcePasswordChangeSerializer(serializers.Serializer):

    new_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Les mots de passe ne correspondent pas."})
        
        # This triggers your CustomPasswordStrengthValidator defined in settings
        user = self.context['request'].user
        try:
            validate_password(data['new_password'], user)
        except ValidationError as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})
            
        return data        