from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class ImportSourceType(models.TextChoices):
    CSV = "CSV", "CSV"
    XLSX = "XLSX", "XLSX"
    API = "API", "API"


class CandidateImportBatch(TimeStampedModel):
    source = models.CharField(max_length=10, choices=ImportSourceType.choices)
    initiated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="candidate_imports",
    )
    total_rows = models.PositiveIntegerField(default=0)
    valid_rows = models.PositiveIntegerField(default=0)
    invalid_rows = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, default="PENDING")
    error_report = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
