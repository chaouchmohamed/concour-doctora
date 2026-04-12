import uuid

from django.core.files.base import ContentFile

from apps.audit.services import log_event
from apps.audit.models import ActionType

from .models import PVDocument, PVType


def _generate_document_identifier() -> str:
    return f"PV-{uuid.uuid4().hex[:12].upper()}"


def generate_attendance_pv(submission, user) -> PVDocument:
    records = submission.records.select_related("candidate").all()
    present_count = records.filter(status="PRESENT").count()
    absent_count = records.filter(status="ABSENT").count()
    absentees = [
        {
            "application_number": r.candidate.application_number,
            "full_name": f"{r.candidate.last_name} {r.candidate.first_name}",
        }
        for r in records.filter(status="ABSENT")
    ]

    content = (
        f"PV DE SURVEILLANCE\n"
        f"====================\n"
        f"Session: {submission.exam_schedule.subject.exam_session}\n"
        f"Sujet: {submission.exam_schedule.subject.name}\n"
        f"Salle: {submission.exam_schedule.room.name}\n"
        f"Date: {submission.exam_schedule.exam_date}\n"
        f"Heure de début: {submission.exam_schedule.start_time}\n"
        f"Durée: {submission.exam_schedule.duration_minutes} min\n"
        f"-------------------\n"
        f"Total présent: {present_count}\n"
        f"Total absent: {absent_count}\n"
        f"-------------------\n"
        f"Absents:\n"
    )
    for a in absentees:
        content += f"  - {a['application_number']}: {a['full_name']}\n"
    if submission.incidents:
        content += f"-------------------\nIncidents:\n{submission.incidents}\n"

    doc_id = _generate_document_identifier()
    filename = f"pv_attendance_{submission.id}.txt"
    pv = PVDocument.objects.create(
        pv_type=PVType.ATTENDANCE,
        exam_session_id=submission.exam_schedule.subject.exam_session_id,
        document_identifier=doc_id,
        generated_by=user,
    )
    pv.file.save(filename, ContentFile(content.encode("utf-8")))

    log_event(
        user=user,
        target=pv,
        action=ActionType.CREATE,
        details={
            "event": "PV_GENERATED",
            "pv_type": PVType.ATTENDANCE,
            "submission_id": submission.id,
        },
    )

    return pv
