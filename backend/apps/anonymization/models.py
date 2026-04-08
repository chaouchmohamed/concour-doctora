from django.db import models

from apps.common.models import TimeStampedModel


class AnonymousCode(TimeStampedModel):
    code = models.CharField(max_length=20, unique=True)
    candidate_id_encrypted = models.TextField()
    exam_session_id = models.BigIntegerField()
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "anonymization"
        ordering = ["id"]

    def __str__(self):
        return self.code


class ExamCopy(TimeStampedModel):
    anonymous_code = models.ForeignKey(AnonymousCode, on_delete=models.CASCADE, related_name="copies")
    file = models.FileField(upload_to="scans/")
    uploaded_by_user_id = models.BigIntegerField(null=True, blank=True)
    qr_detected_code = models.CharField(max_length=64, blank=True)

    class Meta:
        app_label = "anonymization"
        ordering = ["id"]
