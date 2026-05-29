from datetime import timedelta

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel

from .managers import UserManager


class RoleChoices(models.TextChoices):
    ADMIN = "ADMIN", "Administrator"
    CFD_HEAD = "CFD_HEAD", "CFD Head"
    COORDINATOR = "COORDINATOR", "Coordinator"
    CORRECTOR = "CORRECTOR", "Corrector"
    SUPERVISOR = "SUPERVISOR", "Supervisor"
    JURY_PRESIDENT = "JURY_PRESIDENT", "Jury President"
    JURY_MEMBER = "JURY_MEMBER", "Jury Member"
    ANONYMITY_COMMISSION = "ANONYMITY_COMMISSION", "Anonymity Commission"


class User(TimeStampedModel, AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=32, choices=RoleChoices.choices)

    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    failed_login_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    invited_by = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="invited_users",
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.email

    @property
    def is_locked(self) -> bool:
        return bool(self.locked_until and self.locked_until > timezone.now())

    def register_failed_login(self, max_attempts: int = 3, lock_minutes: int = 15) -> None:
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= max_attempts:
            self.locked_until = timezone.now() + timedelta(minutes=lock_minutes)
            # TODO: notify ADMIN users via async task when lockout is triggered.
        self.save(update_fields=["failed_login_attempts", "locked_until", "updated_at"])

    def clear_failed_logins(self) -> None:
        if self.failed_login_attempts or self.locked_until:
            self.failed_login_attempts = 0
            self.locked_until = None
            self.save(update_fields=["failed_login_attempts", "locked_until", "updated_at"])


class UserInvite(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="invites")
    invited_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="issued_invites",
    )
    token_hash = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Invite<{self.user.email}>"

    @property
    def is_usable(self) -> bool:
        return self.used_at is None and self.expires_at > timezone.now()
