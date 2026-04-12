from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.conf import settings

from apps.candidates.models import Candidate, CandidateStatus
from apps.examinations.models import ExamSessionStatus, SubjectSchedule
from .models import NotificationOutbox, NotificationStatus


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def send_convocation_email_task(self, candidate_id: int) -> None:
    """
    Fetch candidate + exam schedule and send convocation email.
    Records the attempt to NotificationOutbox.
    """
    try:
        candidate = Candidate.objects.get(id=candidate_id)
    except Candidate.DoesNotExist:
        return  # Nothing to do if candidate is missing

    if candidate.status != CandidateStatus.REGISTERED:
        return

    # Fetch active exam schedules for this candidate's field (if field partitioning existed, else globally for now)
    schedules = SubjectSchedule.objects.filter(
        subject__exam_session__status=ExamSessionStatus.ACTIVE
    ).select_related("subject", "room").order_by("exam_date", "start_time")

    schedule_data = [
        {
            "subject_name": s.subject.name,
            "date": s.exam_date,
            "time": s.start_time,
            "room": s.room.name,
            "duration": s.duration_minutes,
        }
        for s in schedules
    ]

    context = {
        "candidate_name": f"{candidate.first_name} {candidate.last_name}",
        "application_number": candidate.application_number,
        "schedules": schedule_data,
    }

    subject = "Convocation au Concours de Doctorat"
    text_body = render_to_string("notifications/emails/convocation.txt", context)
    html_body = render_to_string("notifications/emails/convocation.html", context)

    outbox = NotificationOutbox.objects.create(
        channel="EMAIL",
        recipient=candidate.email,
        subject=subject,
        payload={"candidate_id": candidate.id, "application_number": candidate.application_number},
        status=NotificationStatus.PENDING,
    )

    try:
        send_mail(
            subject=subject,
            message=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[candidate.email],
            html_message=html_body,
            fail_silently=False,
        )
        outbox.status = NotificationStatus.SENT
        outbox.sent_at = timezone.now()
        outbox.save(update_fields=["status", "sent_at"])
    except Exception as e:
        outbox.status = NotificationStatus.FAILED
        outbox.error_message = str(e)
        outbox.save(update_fields=["status", "error_message"])
        raise e  # Reraise to trigger celery retry


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def generate_pv_pdf_task(self, pv_document_id: int) -> None:
    """
    TODO: render and persist official PV PDF.
    """
    _ = pv_document_id
