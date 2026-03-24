from django.db import models
from django.contrib.auth.models import User

# User Roles
USER_ROLES = [
    ('ADMIN', 'Administrator'),
    ('CFD_HEAD', 'CFD Head'),
    ('COORDINATOR', 'Coordinator'),
    ('CORRECTOR', 'Corrector'),
    ('SUPERVISOR', 'Supervisor'),
    ('JURY_PRESIDENT', 'Jury President'),
    ('JURY_MEMBER', 'Jury Member'),
    ('ANONYMITY_COMMISSION', 'Anonymity Commission'),
    ('CANDIDATE', 'Candidate'),
]


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=USER_ROLES, default='CANDIDATE')
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True)
    signature = models.ImageField(upload_to='signatures/', null=True, blank=True)
    email_notifications = models.BooleanField(default=True)
    
    # SECURITY FLAG: Forces password change on first login
    must_change_password = models.BooleanField(default=True) 
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
        indexes = [
            models.Index(fields=['role']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"


