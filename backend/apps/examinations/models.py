from django.db import models

from apps.common.models import TimeStampedModel


class ExamSessionStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    ACTIVE = "ACTIVE", "Active"
    CLOSED = "CLOSED", "Closed"


class FinalGradeRule(models.TextChoices):
    AVERAGE = "AVERAGE", "Average"
    MEDIAN = "MEDIAN", "Median"
    THIRD_CORRECTOR = "THIRD_CORRECTOR", "Third Corrector"


class ExamSubjectStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    ACTIVE = "ACTIVE", "Active"
    LOCKED = "LOCKED", "Locked"


class ExamSession(TimeStampedModel):
    name = models.CharField(max_length=120)
    year = models.PositiveIntegerField()
    status = models.CharField(max_length=16, choices=ExamSessionStatus.choices, default=ExamSessionStatus.DRAFT)
    starts_at = models.DateField(null=True, blank=True)
    ends_at = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-year", "id"]

    def __str__(self):
        return f"{self.name} ({self.year})"


class ExamSubject(TimeStampedModel):
    exam_session = models.ForeignKey(ExamSession, on_delete=models.CASCADE, related_name="subjects")
    name = models.CharField(max_length=200)
    coefficient = models.DecimalField(max_digits=4, decimal_places=2)
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=20.00)
    pass_threshold = models.DecimalField(max_digits=5, decimal_places=2)
    discrepancy_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=3.00)
    final_grade_rule = models.CharField(max_length=20, choices=FinalGradeRule.choices, default=FinalGradeRule.AVERAGE)
    status = models.CharField(max_length=10, choices=ExamSubjectStatus.choices, default=ExamSubjectStatus.DRAFT)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.name


class ExamRoom(TimeStampedModel):
    exam_session = models.ForeignKey(ExamSession, on_delete=models.CASCADE, related_name="rooms")
    name = models.CharField(max_length=100)
    capacity = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.name


class SubjectSchedule(TimeStampedModel):
    subject = models.ForeignKey(ExamSubject, on_delete=models.CASCADE, related_name="schedules")
    room = models.ForeignKey(ExamRoom, on_delete=models.CASCADE, related_name="schedules")
    exam_date = models.DateField()
    start_time = models.TimeField()
    duration_minutes = models.PositiveIntegerField()

    class Meta:
        ordering = ["exam_date", "start_time", "id"]
        unique_together = (("subject", "room", "exam_date", "start_time"),)


class ExamAllocation(TimeStampedModel):
    candidate = models.ForeignKey("candidates.Candidate", on_delete=models.CASCADE, related_name="allocations")
    subject_schedule = models.ForeignKey(SubjectSchedule, on_delete=models.CASCADE, related_name="allocations")
    seat_number = models.PositiveIntegerField()

    class Meta:
        ordering = ["subject_schedule", "seat_number"]
        unique_together = (
            ("subject_schedule", "candidate"),
            ("subject_schedule", "seat_number"),
        )

    def __str__(self):
        return f"{self.candidate} -> {self.subject_schedule} (Seat {self.seat_number})"
