from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.candidates.models import Candidate, CandidateStatus
from apps.audit.services import log_event
from apps.audit.models import ActionType
from apps.pv.services import generate_attendance_pv

from .models import AttendanceRecord, AttendanceSubmission, AttendanceStatus


def undo_attendance_record(record: AttendanceRecord, user) -> None:
    if record.submission.is_finalized:
        raise ValidationError({"detail": "Cannot undo: the attendance submission is already finalized."})
    candidate_id = record.candidate_id
    previous_status = record.status
    submission = record.submission
    record.delete()
    log_event(
        user=user,
        target=submission,
        action=ActionType.DELETE,
        details={
            "event": "ATTENDANCE_UNDO",
            "candidate_id": candidate_id,
            "previous_status": previous_status,
        },
    )


def toggle_attendance_record(record: AttendanceRecord, user) -> AttendanceRecord:
    if record.submission.is_finalized:
        raise ValidationError({"detail": "Cannot toggle: the attendance submission is already finalized."})
    record.status = AttendanceStatus.ABSENT if record.status == AttendanceStatus.PRESENT else AttendanceStatus.PRESENT
    record.save(update_fields=["status"])
    log_event(
        user=user,
        target=record.submission,
        action=ActionType.UPDATE,
        details={
            "event": "ATTENDANCE_TOGGLE",
            "candidate_id": record.candidate_id,
            "new_status": record.status,
        },
    )
    return record


@transaction.atomic
def finalize_attendance(submission: AttendanceSubmission, user):
    if submission.is_finalized:
        raise ValidationError({"detail": "This attendance submission is already finalized."})

    expected_allocations = submission.exam_schedule.allocations.count()
    marked_records = submission.records.count()

    if expected_allocations != marked_records:
        raise ValidationError({
            "detail": f"Cannot finalize. Only {marked_records} out of {expected_allocations} "
                      f"expected candidates have been marked."
        })

    absent_records = submission.records.filter(status=AttendanceStatus.ABSENT)
    absent_candidate_ids = list(absent_records.values_list("candidate_id", flat=True))

    if absent_candidate_ids:
        Candidate.objects.filter(id__in=absent_candidate_ids).update(status=CandidateStatus.ELIMINATED)

    submission.is_finalized = True
    submission.save(update_fields=["is_finalized"])

    log_event(
        user=user,
        target=submission,
        action=ActionType.UPDATE,
        details={
            "event": "ATTENDANCE_FINALIZED",
            "schedule_id": submission.exam_schedule_id,
            "eliminated_count": len(absent_candidate_ids),
        },
    )

    pv = generate_attendance_pv(submission, user)

    return submission, pv


def get_attendance_counter(submission: AttendanceSubmission) -> dict:
    total = submission.exam_schedule.allocations.count()
    marked = submission.records.count()
    present = submission.records.filter(status=AttendanceStatus.PRESENT).count()
    absent = submission.records.filter(status=AttendanceStatus.ABSENT).count()
    return {
        "submission_id": submission.id,
        "schedule_id": submission.exam_schedule_id,
        "total_expected": total,
        "total_marked": marked,
        "total_unmarked": total - marked,
        "present_count": present,
        "absent_count": absent,
        "is_finalized": submission.is_finalized,
    }


@transaction.atomic
def import_attendance_csv(submission: AttendanceSubmission, rows: list[dict], user) -> dict:
    if submission.is_finalized:
        raise ValidationError({"detail": "Cannot import into a finalized attendance submission."})

    allocations = submission.exam_schedule.allocations.select_related("candidate")
    allocation_map = {alloc.candidate.application_number: alloc.candidate for alloc in allocations}

    created_count = 0
    skipped_count = 0
    errors: list[dict] = []

    existing_candidate_ids = set(
        submission.records.values_list("candidate_id", flat=True)
    )

    for row_number, row in enumerate(rows, start=1):
        app_num = str(row.get("application_number", "")).strip()
        status_val = str(row.get("status", "")).strip().upper()

        if not app_num:
            errors.append({"row": row_number, "message": "application_number is required."})
            continue

        if status_val not in AttendanceStatus.values:
            errors.append({
                "row": row_number,
                "message": f"Invalid status '{status_val}'. Must be PRESENT or ABSENT.",
            })
            continue

        candidate = allocation_map.get(app_num)
        if candidate is None:
            errors.append({
                "row": row_number,
                "message": f"No allocation found for application_number '{app_num}' in this schedule.",
            })
            continue

        if candidate.id in existing_candidate_ids:
            skipped_count += 1
            continue

        AttendanceRecord.objects.create(
            submission=submission,
            candidate=candidate,
            status=status_val,
            marked_by=user,
        )
        existing_candidate_ids.add(candidate.id)
        created_count += 1

    log_event(
        user=user,
        target=submission,
        action=ActionType.IMPORT,
        details={
            "event": "ATTENDANCE_CSV_IMPORT",
            "created_count": created_count,
            "skipped_count": skipped_count,
            "error_count": len(errors),
        },
    )

    return {
        "created": created_count,
        "skipped_duplicates": skipped_count,
        "errors": errors,
    }
