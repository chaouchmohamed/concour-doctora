from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class CorrectionOrder(models.TextChoices):
    FIRST = "FIRST", "First"
    SECOND = "SECOND", "Second"
    THIRD = "THIRD", "Third"


class CorrectionAssignment(TimeStampedModel):
    anonymous_code = models.CharField(max_length=20)
    exam_subject_id = models.BigIntegerField()
    corrector = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="correction_assignments",
    )
    order = models.CharField(max_length=10, choices=CorrectionOrder.choices)

    class Meta:
        ordering = ["id"]
        unique_together = (
            ("anonymous_code", "exam_subject_id", "order"),
            ("anonymous_code", "exam_subject_id", "corrector"),
        )


class CopyGrade(TimeStampedModel):
    anonymous_code = models.CharField(max_length=20)
    exam_subject_id = models.BigIntegerField()
    corrector = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="copy_grades",
    )
    grade = models.DecimalField(max_digits=5, decimal_places=2)
    correction_order = models.CharField(max_length=10, choices=CorrectionOrder.choices)
    submitted_at = models.DateTimeField(auto_now_add=True)
    is_final = models.BooleanField(default=False)

    class Meta:
        ordering = ["id"]


class GradeDiscrepancy(TimeStampedModel):
    anonymous_code = models.CharField(max_length=20)
    exam_subject_id = models.BigIntegerField()
    difference = models.DecimalField(max_digits=5, decimal_places=2)
    is_resolved = models.BooleanField(default=False)
    resolution_note = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]


class SubjectGradeLock(TimeStampedModel):
    exam_subject_id = models.BigIntegerField(unique=True)
    locked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="grade_locks",
    )
    locked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
