from django.http import JsonResponse
from django.urls import reverse

class ForcePasswordChangeMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Si connecté ET que le drapeau est levé 
        if request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.must_change_password:
            
            # Seules les actions "Changer le mot de passe" et "Se déconnecter" sont permises
            allowed_paths = [reverse('api_password_change'), reverse('api_logout')]
            
            if not request.path.startswith('/admin/') and request.path not in allowed_paths:
                # On bloque l'accès aux autres endpoints de ton API
                return JsonResponse({
                    "error": "FORBIDDEN",
                    "code": "PASSWORD_CHANGE_REQUIRED",
                    "detail": "Veuillez mettre à jour votre mot de passe."
                }, status=403)

        return self.get_response(request)