from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class AttendanceStatus(models.TextChoices):
    PRESENT = "PRESENT", "Present"
    ABSENT = "ABSENT", "Absent"


class AttendanceSubmission(TimeStampedModel):
    exam_schedule_id = models.BigIntegerField()  # TODO: replace with FK once room scheduling model is stabilized.
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="attendance_submissions",
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    is_finalized = models.BooleanField(default=False)
    incidents = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]


class AttendanceRecord(TimeStampedModel):
    submission = models.ForeignKey(AttendanceSubmission, on_delete=models.CASCADE, related_name="records")
    candidate_id = models.BigIntegerField()  # Candidate kept as id in skeleton to avoid premature coupling.
    status = models.CharField(max_length=10, choices=AttendanceStatus.choices)
    marked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="attendance_marks",
    )

    class Meta:
        unique_together = (("submission", "candidate_id"),)
        ordering = ["id"]
