from django.db import models

from apps.common.models import TimeStampedModel


class NotificationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    SENT = "SENT", "Sent"
    FAILED = "FAILED", "Failed"


class NotificationOutbox(TimeStampedModel):
    channel = models.CharField(max_length=30, default="EMAIL")
    recipient = models.EmailField()
    subject = models.CharField(max_length=255)
    payload = models.JSONField(default=dict)
    status = models.CharField(max_length=10, choices=NotificationStatus.choices, default=NotificationStatus.PENDING)
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
