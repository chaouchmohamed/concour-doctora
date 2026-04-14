import math
import secrets

from django.core.files.base import ContentFile
from rest_framework.exceptions import ValidationError

from apps.audit.services import log_event
from apps.audit.models import ActionType
from apps.candidates.models import Candidate, CandidateStatus
from apps.pv.models import PVDocument, PVType
from apps.pv.services import _generate_document_identifier

from .models import ExamAllocation, ExamRoom, ExamSession, ExamSubject, SubjectSchedule


def auto_allocate_candidates(schedule: SubjectSchedule, user) -> dict:
    session = schedule.subject.exam_session
    subject = schedule.subject

    ExamAllocation.objects.filter(subject_schedule__subject=subject).delete()

    candidates = list(
        Candidate.objects.filter(
            status=CandidateStatus.REGISTERED,
        )
        .distinct()
        .order_by("?")
    )

    if not candidates:
        raise ValidationError({"detail": "No registered candidates found to allocate."})

    rooms = list(
        ExamRoom.objects.filter(
            schedules__subject=schedule.subject,
            schedules__exam_date=schedule.exam_date,
            schedules__start_time=schedule.start_time,
        ).distinct()
    )

    if not rooms:
        rooms = list(ExamRoom.objects.filter(exam_session=session))

    if not rooms:
        raise ValidationError({"detail": "No rooms available for this session."})

    shuffled = list(candidates)
    secrets.SystemRandom().shuffle(shuffled)

    per_room = math.ceil(len(shuffled) / len(rooms))

    created = 0
    for i, candidate in enumerate(shuffled):
        room_index = min(i // per_room, len(rooms) - 1)
        room = rooms[room_index]
        seat_number = (i % per_room) + 1

        schedule_for_room = SubjectSchedule.objects.filter(
            subject=schedule.subject,
            room=room,
            exam_date=schedule.exam_date,
            start_time=schedule.start_time,
        ).first()

        target_schedule = schedule_for_room or schedule

        ExamAllocation.objects.create(
            candidate=candidate,
            subject_schedule=target_schedule,
            seat_number=seat_number,
        )
        created += 1

    log_event(
        user=user,
        target=schedule,
        action=ActionType.CREATE,
        details={
            "event": "CANDIDATES_AUTO_ALLOCATED",
            "schedule_id": schedule.id,
            "candidates_allocated": created,
        },
    )

    return {
        "schedule_id": schedule.id,
        "candidates_allocated": created,
        "rooms_used": len(rooms),
        "per_room": per_room,
    }


def generate_call_list(schedule: SubjectSchedule) -> list[dict]:
    allocations = (
        ExamAllocation.objects.filter(subject_schedule=schedule)
        .select_related("candidate")
        .order_by("seat_number")
    )

    return [
        {
            "seat_number": a.seat_number,
            "application_number": a.candidate.application_number,
            "full_name": f"{a.candidate.last_name} {a.candidate.first_name}",
            "room": schedule.room.name,
        }
        for a in allocations
    ]


def generate_call_list_by_subject(subject: ExamSubject) -> list[dict]:
    schedules = SubjectSchedule.objects.filter(subject=subject).order_by(
        "exam_date", "start_time", "room"
    )
    result = []
    for schedule in schedules:
        entries = generate_call_list(schedule)
        result.append(
            {
                "exam_date": str(schedule.exam_date),
                "start_time": str(schedule.start_time),
                "room": schedule.room.name,
                "duration_minutes": schedule.duration_minutes,
                "candidates": entries,
            }
        )
    return result


def generate_call_list_file(schedule: SubjectSchedule) -> str:
    entries = generate_call_list(schedule)
    content = (
        f"LISTE D'APPEL\n"
        f"====================\n"
        f"Session: {schedule.subject.exam_session}\n"
        f"Subject: {schedule.subject.name}\n"
        f"Room: {schedule.room.name}\n"
        f"Date: {schedule.exam_date}\n"
        f"Time: {schedule.start_time}\n"
        f"Duration: {schedule.duration_minutes} min\n"
        f"-------------------\n"
    )
    for e in entries:
        content += f"  Seat {e['seat_number']:>3}: {e['application_number']} — {e['full_name']}\n"
    content += f"-------------------\nTotal: {len(entries)} candidates\n"
    return content


def generate_call_list_file_by_subject(subject: ExamSubject) -> str:
    data = generate_call_list_by_subject(subject)
    content = (
        f"LISTE D'APPEL CONSOLIDEE\n"
        f"========================\n"
        f"Subject: {subject.name}\n"
        f"Session: {subject.exam_session}\n"
    )
    total = 0
    for block in data:
        content += (
            f"\n--- Room: {block['room']} | "
            f"Date: {block['exam_date']} | "
            f"Time: {block['start_time']} | "
            f"Duration: {block['duration_minutes']} min ---\n"
        )
        for e in block["candidates"]:
            content += f"  Seat {e['seat_number']:>3}: {e['application_number']} — {e['full_name']}\n"
        total += len(block["candidates"])
    content += f"\n-------------------\nGrand total: {total} candidates\n"
    return content


def record_subjects_submission(session: ExamSession, user) -> PVDocument:
    subjects = session.subjects.all()
    if not subjects.exists():
        raise ValidationError({"detail": "No subjects defined for this session."})

    content = (
        f"PV DE CREATION DES SUJETS\n"
        f"==========================\n"
        f"Session: {session.name} ({session.year})\n"
        f"-------------------\n"
        f"Sujets:\n"
    )
    for s in subjects:
        content += (
            f"  - {s.name} (coeff={s.coefficient}, seuil={s.pass_threshold}, "
            f"max={s.max_score}, seuil_ecart={s.discrepancy_threshold})\n"
        )
    content += f"-------------------\nTotal sujets: {subjects.count()}\n"

    doc_id = _generate_document_identifier()
    pv = PVDocument.objects.create(
        pv_type=PVType.SUBJECT_CREATION,
        exam_session_id=session.id,
        document_identifier=doc_id,
        generated_by=user,
    )
    pv.file.save(
        f"pv_subject_creation_{session.id}.txt", ContentFile(content.encode("utf-8"))
    )

    log_event(
        user=user,
        target=pv,
        action=ActionType.CREATE,
        details={
            "event": "PV_GENERATED",
            "pv_type": PVType.SUBJECT_CREATION,
            "session_id": session.id,
            "subjects_count": subjects.count(),
        },
    )

    return pv


def record_lottery_result(
    session: ExamSession, subject: ExamSubject, user
) -> PVDocument:
    if subject.exam_session_id != session.id:
        raise ValidationError(
            {"detail": "The selected subject does not belong to this session."}
        )

    session.lottery_subject = subject
    session.save(update_fields=["lottery_subject"])

    content = (
        f"PV DE TIRAGE AU SORT DES SUJETS\n"
        f"================================\n"
        f"Session: {session.name} ({session.year})\n"
        f"Sujet selectionne: {subject.name}\n"
        f"-------------------\n"
    )
    all_subjects = session.subjects.all()
    for s in all_subjects:
        marker = " <-- SELECTIONNE" if s.id == subject.id else ""
        content += f"  - {s.name}{marker}\n"

    doc_id = _generate_document_identifier()
    pv = PVDocument.objects.create(
        pv_type=PVType.SUBJECT_LOTTERY,
        exam_session_id=session.id,
        document_identifier=doc_id,
        generated_by=user,
    )
    pv.file.save(f"pv_lottery_{session.id}.txt", ContentFile(content.encode("utf-8")))

    log_event(
        user=user,
        target=pv,
        action=ActionType.CREATE,
        details={
            "event": "PV_GENERATED",
            "pv_type": PVType.SUBJECT_LOTTERY,
            "session_id": session.id,
            "selected_subject": subject.name,
        },
    )

    log_event(
        user=user,
        target=session,
        action=ActionType.UPDATE,
        details={
            "event": "LOTTERY_RESULT_RECORDED",
            "session_id": session.id,
            "selected_subject_id": subject.id,
        },
    )

    return pv
