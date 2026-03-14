from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')

    # True = Bloqué sur la page de changement de mot de passe avec middelware qui vérifie ce champ à chaque requete !!-_-!!
    must_change_password = models.BooleanField(default=False)