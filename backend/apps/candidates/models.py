from django.db import models

from apps.common.models import TimeStampedModel


class CandidateStatus(models.TextChoices):
    REGISTERED = "REGISTERED", "Registered"
    PRESENT = "PRESENT", "Present"
    ABSENT = "ABSENT", "Absent"
    ELIMINATED = "ELIMINATED", "Eliminated"


class Candidate(TimeStampedModel):
    national_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=150)
    phone = models.CharField(max_length=20)
    application_number = models.CharField(max_length=20, unique=True)
    status = models.CharField(
        max_length=16,
        choices=CandidateStatus.choices,
        default=CandidateStatus.REGISTERED,
    )
    imported_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.application_number} - {self.last_name} {self.first_name}"
