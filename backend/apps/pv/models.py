from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class PVType(models.TextChoices):
    SUBJECT_CREATION = "SUBJECT_CREATION", "PV of Subject Creation"
    SUBJECT_LOTTERY = "SUBJECT_LOTTERY", "PV of Subject Lottery"
    ATTENDANCE = "ATTENDANCE", "PV of Attendance"
    ANONYMIZATION = "ANONYMIZATION", "PV of Anonymization"
    CORRECTION = "CORRECTION", "PV of Correction"
    DELIBERATION = "DELIBERATION", "PV of Deliberation"


class PVDocument(TimeStampedModel):
    pv_type = models.CharField(max_length=30, choices=PVType.choices)
    exam_session_id = models.BigIntegerField()
    document_identifier = models.CharField(max_length=64, unique=True)
    file = models.FileField(upload_to="pv/")
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="generated_pvs",
    )
    is_archived = models.BooleanField(default=False)

    class Meta:
        ordering = ["-generated_at"]


class PVSignature(TimeStampedModel):
    pv_document = models.ForeignKey(PVDocument, on_delete=models.CASCADE, related_name="signatures")
    signer_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="pv_signatures",
    )
    signer_name = models.CharField(max_length=255)
    signed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
