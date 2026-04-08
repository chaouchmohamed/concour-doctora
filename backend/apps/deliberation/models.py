from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class DeliberationStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    CLOSED = "CLOSED", "Closed"


class DeliberationOutcome(models.TextChoices):
    ADMITTED = "ADMITTED", "Admitted"
    WAITING_LIST = "WAITING_LIST", "Waiting List"
    REJECTED = "REJECTED", "Rejected"


class DeliberationRun(TimeStampedModel):
    exam_session_id = models.BigIntegerField(unique=True)
    status = models.CharField(max_length=10, choices=DeliberationStatus.choices, default=DeliberationStatus.OPEN)
    closed_at = models.DateTimeField(null=True, blank=True)
    closed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="deliberations_closed",
    )

    class Meta:
        ordering = ["-created_at"]


class DeliberationResult(TimeStampedModel):
    deliberation = models.ForeignKey(DeliberationRun, on_delete=models.CASCADE, related_name="results")
    candidate_id = models.BigIntegerField(null=True, blank=True)
    anonymous_code = models.CharField(max_length=20)
    weighted_average = models.DecimalField(max_digits=5, decimal_places=2)
    rank = models.PositiveIntegerField()
    outcome = models.CharField(max_length=20, choices=DeliberationOutcome.choices)

    class Meta:
        ordering = ["rank", "id"]
        unique_together = (("deliberation", "rank"),)
