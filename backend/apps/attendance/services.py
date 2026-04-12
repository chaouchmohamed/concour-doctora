from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.candidates.models import Candidate, CandidateStatus
from apps.audit.services import log_event
from apps.audit.models import ActionType

from .models import AttendanceSubmission, AttendanceStatus


@transaction.atomic
def finalize_attendance(submission: AttendanceSubmission, user):
    """
    Finalize an attendance submission, ensuring all candidates assigned to this 
    schedule have been marked. Also updates all ABSENT candidates to ELIMINATED.
    """
    if submission.is_finalized:
        raise ValidationError({"detail": "This attendance submission is already finalized."})

    # Validate that every candidate in the `ExamAllocation` for this schedule
    # has a corresponding `AttendanceRecord` in this submission.
    expected_allocations = submission.exam_schedule.allocations.count()
    marked_records = submission.records.count()

    if expected_allocations != marked_records:
        raise ValidationError({
            "detail": f"Cannot finalize. Only {marked_records} out of {expected_allocations} "
                      f"expected candidates have been marked."
        })

    # Propagate ABSENT -> ELIMINATED
    absent_records = submission.records.filter(status=AttendanceStatus.ABSENT)
    absent_candidate_ids = absent_records.values_list("candidate_id", flat=True)

    if absent_candidate_ids:
        # Update the globally tracked candidate status
        Candidate.objects.filter(id__in=absent_candidate_ids).update(status=CandidateStatus.ELIMINATED)

    submission.is_finalized = True
    submission.save(update_fields=["is_finalized"])

    # Audit the finalization event
    log_event(
        user=user,
        target=submission,
        action=ActionType.UPDATE,
        details={
            "event": "ATTENDANCE_FINALIZED",
            "schedule_id": submission.exam_schedule_id,
            "eliminated_count": len(absent_candidate_ids),
        }
    )
    
    return submission
