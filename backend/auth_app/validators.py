import re
from django.core.exceptions import ValidationError

class CustomPasswordStrengthValidator:
    def validate(self, password, user=None):
        errors = []
        if len(password) < 10:
            errors.append("Au moins 10 caractères.")
        if not re.search(r'[A-Z]', password):
            errors.append("Au moins une majuscule.")
        if not re.search(r'[a-z]', password):
            errors.append("Au moins une minuscule.")
        if not re.search(r'[0-9]', password):
            errors.append("Au moins un chiffre.")
        
        if errors:
            raise ValidationError(errors)