from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.db import models


class ImmutableQuerySet(models.QuerySet):
    def delete(self):
        raise PermissionDenied("Audit logs are immutable and cannot be deleted.")


class ImmutableManager(models.Manager):
    def get_queryset(self):
        return ImmutableQuerySet(self.model, using=self._db)


class AuditLog(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
    )
    role = models.CharField(max_length=50)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    action_type = models.CharField(max_length=100)
    affected_object_type = models.CharField(max_length=50)
    affected_object_id = models.BigIntegerField(null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)

    objects = ImmutableManager()

    class Meta:
        ordering = ["-timestamp", "-id"]

    def save(self, *args, **kwargs):
        if self.pk:
            raise PermissionDenied("Audit logs are immutable and cannot be updated.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionDenied("Audit logs are immutable and cannot be deleted.")

    def __str__(self):
        return f"{self.timestamp} - {self.action_type}"
