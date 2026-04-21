from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.accounts.models import RoleChoices, User
from apps.anonymization.models import AnonymousCode
from apps.audit.models import ActionType
from apps.audit.services import log_event
from apps.correction.models import CopyGrade, SubjectGradeLock
from apps.examinations.models import ExamSession, ExamSubject
from apps.pv.models import PVDocument, PVSignature, PVType
from apps.pv.services import _generate_document_identifier

from .models import (
    DeliberationOutcome,
    DeliberationResult,
    DeliberationRun,
    DeliberationStatus,
)


def compute_deliberation_results(session_id: int, user) -> dict:
    try:
        session = ExamSession.objects.get(pk=session_id)
    except ExamSession.DoesNotExist:
        raise ValidationError(
            {"detail": f"ExamSession with id {session_id} does not exist."}
        )

    subjects = list(ExamSubject.objects.filter(exam_session=session))
    if not subjects:
        raise ValidationError({"detail": "No subjects found for this session."})

    subject_ids = [s.id for s in subjects]
    for sid in subject_ids:
        if not SubjectGradeLock.objects.filter(exam_subject_id=sid).exists():
            raise ValidationError(
                {
                    "detail": f"Subject '{ExamSubject.objects.get(pk=sid).name}' "
                    f"is not locked yet. All subjects must be locked before deliberation."
                }
            )

    anonymous_codes = list(
        AnonymousCode.objects.filter(exam_session_id=session_id).values_list(
            "code", flat=True
        )
    )
    if not anonymous_codes:
        raise ValidationError({"detail": "No anonymous codes found for this session."})

    coefficients = {s.id: s.coefficient for s in subjects}
    total_coeff = sum(coefficients.values())

    deliberation, _ = DeliberationRun.objects.get_or_create(
        exam_session_id=session_id,
        defaults={
            "status": DeliberationStatus.OPEN,
            "admission_threshold": Decimal("10.00"),
            "waiting_list_capacity": 0,
        },
    )

    if deliberation.status == DeliberationStatus.CLOSED:
        raise ValidationError(
            {"detail": "Deliberation is already closed. Reopen to recompute."}
        )

    DeliberationResult.objects.filter(deliberation=deliberation).delete()

    results_data = []
    for code in anonymous_codes:
        final_grades = CopyGrade.objects.filter(
            anonymous_code=code,
            exam_subject_id__in=subject_ids,
            is_final=True,
        )

        if not final_grades.exists():
            continue

        weighted_sum = Decimal("0.00")
        covered_coeff = Decimal("0.00")
        for grade in final_grades:
            coeff = coefficients.get(grade.exam_subject_id, Decimal("0.00"))
            weighted_sum += grade.grade * coeff
            covered_coeff += coeff

        if covered_coeff == 0:
            continue

        weighted_avg = (weighted_sum / covered_coeff).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        results_data.append(
            {
                "anonymous_code": code,
                "weighted_average": weighted_avg,
            }
        )

    if not results_data:
        raise ValidationError(
            {"detail": "No final grades found for any copy in this session."}
        )

    results_data.sort(key=lambda r: r["weighted_average"], reverse=True)

    threshold = deliberation.admission_threshold
    wl_capacity = deliberation.waiting_list_capacity

    admitted_count = sum(1 for r in results_data if r["weighted_average"] >= threshold)

    with transaction.atomic():
        for idx, r in enumerate(results_data):
            rank = idx + 1
            wa = r["weighted_average"]

            if wa >= threshold:
                outcome = DeliberationOutcome.ADMITTED
            elif idx < admitted_count + wl_capacity:
                outcome = DeliberationOutcome.WAITING_LIST
            else:
                outcome = DeliberationOutcome.REJECTED

            DeliberationResult.objects.create(
                deliberation=deliberation,
                anonymous_code=r["anonymous_code"],
                weighted_average=wa,
                rank=rank,
                outcome=outcome,
            )

    log_event(
        user=user,
        target=deliberation,
        action=ActionType.CREATE,
        details={
            "event": "DELIBERATION_COMPUTED",
            "session_id": session_id,
            "results_count": len(results_data),
            "admitted": admitted_count,
            "threshold": str(threshold),
        },
    )

    return {
        "deliberation_id": deliberation.id,
        "session_id": session_id,
        "results_count": len(results_data),
        "admitted": admitted_count,
        "waiting_list": sum(
            1
            for r in results_data
            if r["weighted_average"] < threshold
            and results_data.index(r) < admitted_count + wl_capacity
        ),
        "rejected": sum(
            1
            for r in results_data
            if r not in results_data[: admitted_count + wl_capacity]
            and r["weighted_average"] < threshold
        ),
    }


def close_deliberation(deliberation_id: int, user) -> DeliberationRun:
    try:
        deliberation = DeliberationRun.objects.get(pk=deliberation_id)
    except DeliberationRun.DoesNotExist:
        raise ValidationError(
            {"detail": f"DeliberationRun with id {deliberation_id} does not exist."}
        )

    if deliberation.status == DeliberationStatus.CLOSED:
        raise ValidationError({"detail": "Deliberation is already closed."})

    if deliberation.is_archived:
        raise ValidationError({"detail": "Archived deliberations cannot be closed."})

    if not DeliberationResult.objects.filter(deliberation=deliberation).exists():
        raise ValidationError({"detail": "No results computed yet. Run compute first."})

    from django.utils import timezone

    deliberation.status = DeliberationStatus.CLOSED
    deliberation.closed_at = timezone.now()
    deliberation.closed_by = user
    deliberation.save(update_fields=["status", "closed_at", "closed_by", "updated_at"])

    _lift_anonymity(deliberation)

    log_event(
        user=user,
        target=deliberation,
        action=ActionType.UPDATE,
        details={
            "event": "DELIBERATION_CLOSED",
            "deliberation_id": deliberation_id,
            "session_id": deliberation.exam_session_id,
        },
    )

    return deliberation


def _lift_anonymity(deliberation: DeliberationRun) -> int:
    from apps.anonymization.services import decrypt_candidate_id

    results = DeliberationResult.objects.filter(deliberation=deliberation)
    lifted = 0
    for result in results:
        try:
            anon_code = AnonymousCode.objects.get(code=result.anonymous_code)
            candidate_id = decrypt_candidate_id(anon_code.candidate_id_encrypted)
            result.candidate_id = candidate_id
            result.save(update_fields=["candidate_id"])
            lifted += 1
        except Exception:
            continue

    log_event(
        user=None,
        target=deliberation,
        action=ActionType.OTHER,
        details={
            "event": "ANONYMITY_LIFTED",
            "deliberation_id": deliberation.id,
            "session_id": deliberation.exam_session_id,
            "identities_revealed": lifted,
        },
    )

    return lifted


def generate_deliberation_pv(deliberation_id: int, user) -> PVDocument:
    from django.core.files.base import ContentFile

    try:
        deliberation = DeliberationRun.objects.get(pk=deliberation_id)
    except DeliberationRun.DoesNotExist:
        raise ValidationError(
            {"detail": f"DeliberationRun with id {deliberation_id} does not exist."}
        )

    if deliberation.status != DeliberationStatus.CLOSED:
        raise ValidationError(
            {"detail": "Cannot generate PV: deliberation is not closed yet."}
        )

    results = DeliberationResult.objects.filter(deliberation=deliberation).order_by(
        "rank"
    )

    content = (
        f"PV DE DELIBERATION\n"
        f"===================\n"
        f"Session ID: {deliberation.exam_session_id}\n"
        f"Admission threshold: {deliberation.admission_threshold}\n"
        f"Waiting list capacity: {deliberation.waiting_list_capacity}\n"
        f"Closed at: {deliberation.closed_at}\n"
        f"Closed by: {deliberation.closed_by}\n"
        f"-------------------\n"
        f"Total candidates: {results.count()}\n"
        f"Admitted: {results.filter(outcome=DeliberationOutcome.ADMITTED).count()}\n"
        f"Waiting list: {results.filter(outcome=DeliberationOutcome.WAITING_LIST).count()}\n"
        f"Rejected: {results.filter(outcome=DeliberationOutcome.REJECTED).count()}\n"
        f"-------------------\n"
        f"Results:\n"
    )

    for r in results:
        candidate_info = ""
        if r.candidate_id:
            from apps.candidates.models import Candidate

            try:
                c = Candidate.objects.get(pk=r.candidate_id)
                candidate_info = (
                    f" | {c.application_number} - {c.last_name} {c.first_name}"
                )
            except Candidate.DoesNotExist:
                candidate_info = f" | candidate_id={r.candidate_id}"
        content += (
            f"  Rank {r.rank:>3}: {r.anonymous_code} | "
            f"WA={r.weighted_average} | {r.outcome}{candidate_info}\n"
        )

    doc_id = _generate_document_identifier()
    pv = PVDocument.objects.create(
        pv_type=PVType.DELIBERATION,
        exam_session_id=deliberation.exam_session_id,
        document_identifier=doc_id,
        generated_by=user,
    )
    pv.file.save(
        f"pv_deliberation_{deliberation_id}.txt",
        ContentFile(content.encode("utf-8")),
    )

    log_event(
        user=user,
        target=pv,
        action=ActionType.CREATE,
        details={
            "event": "PV_GENERATED",
            "pv_type": PVType.DELIBERATION,
            "deliberation_id": deliberation_id,
        },
    )

    return pv


def sign_pv(pv_document_id: int, signer_user) -> PVSignature:
    try:
        pv = PVDocument.objects.get(pk=pv_document_id)
    except PVDocument.DoesNotExist:
        raise ValidationError(
            {"detail": f"PVDocument with id {pv_document_id} does not exist."}
        )

    if pv.pv_type != PVType.DELIBERATION:
        raise ValidationError(
            {"detail": "This signing endpoint is for deliberation PVs only."}
        )

    if signer_user.role not in {
        RoleChoices.ADMIN,
        RoleChoices.JURY_PRESIDENT,
        RoleChoices.JURY_MEMBER,
    }:
        raise ValidationError(
            {"detail": "Only ADMIN, JURY_PRESIDENT, or JURY_MEMBER can sign."}
        )

    if PVSignature.objects.filter(pv_document=pv, signer_user=signer_user).exists():
        raise ValidationError({"detail": "You have already signed this PV."})

    signature = PVSignature.objects.create(
        pv_document=pv,
        signer_user=signer_user,
        signer_name=f"{signer_user.last_name} {signer_user.first_name}".strip()
        or signer_user.email,
    )

    log_event(
        user=signer_user,
        target=signature,
        action=ActionType.CREATE,
        details={
            "event": "PV_SIGNED",
            "pv_document_id": pv_document_id,
            "signer_role": signer_user.role,
        },
    )

    return signature


def archive_deliberation(deliberation_id: int, user) -> DeliberationRun:
    try:
        deliberation = DeliberationRun.objects.get(pk=deliberation_id)
    except DeliberationRun.DoesNotExist:
        raise ValidationError(
            {"detail": f"DeliberationRun with id {deliberation_id} does not exist."}
        )

    if deliberation.status != DeliberationStatus.CLOSED:
        raise ValidationError({"detail": "Only closed deliberations can be archived."})

    if deliberation.is_archived:
        raise ValidationError({"detail": "Deliberation is already archived."})

    deliberation.is_archived = True
    deliberation.save(update_fields=["is_archived", "updated_at"])

    pv = PVDocument.objects.filter(
        pv_type=PVType.DELIBERATION,
        exam_session_id=deliberation.exam_session_id,
    ).first()
    if pv:
        pv.is_archived = True
        pv.save(update_fields=["is_archived"])

    log_event(
        user=user,
        target=deliberation,
        action=ActionType.UPDATE,
        details={
            "event": "DELIBERATION_ARCHIVED",
            "deliberation_id": deliberation_id,
            "session_id": deliberation.exam_session_id,
        },
    )

    return deliberation
