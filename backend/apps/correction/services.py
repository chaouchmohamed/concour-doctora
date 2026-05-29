import itertools
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.accounts.models import RoleChoices, User
from apps.audit.models import ActionType
from apps.audit.services import log_event
from apps.examinations.models import ExamSubject, ExamSubjectStatus, FinalGradeRule

from .models import (
    CorrectionAssignment,
    CorrectionOrder,
    CopyGrade,
    GradeDiscrepancy,
    SubjectGradeLock,
)


def assign_correctors(
    subject_id: int,
    corrector_ids: list[int],
    user,
) -> dict:
    try:
        subject = ExamSubject.objects.get(pk=subject_id)
    except ExamSubject.DoesNotExist:
        raise ValidationError(
            {"detail": f"ExamSubject with id {subject_id} does not exist."}
        )

    if len(corrector_ids) < 2:
        raise ValidationError({"detail": "At least 2 correctors are required."})

    correctors = list(
        User.objects.filter(
            pk__in=corrector_ids, role=RoleChoices.CORRECTOR, is_active=True
        )
    )
    if len(correctors) < 2:
        raise ValidationError(
            {"detail": "At least 2 active users with CORRECTOR role are required."}
        )

    existing_grades = CopyGrade.objects.filter(exam_subject_id=subject_id).exists()
    if existing_grades:
        raise ValidationError(
            {
                "detail": "Cannot re-assign correctors: grades already exist for this subject."
            }
        )

    from apps.anonymization.models import AnonymousCode

    anonymous_codes = list(
        AnonymousCode.objects.filter(
            exam_session_id=subject.exam_session_id
        ).values_list("code", flat=True)
    )
    if not anonymous_codes:
        raise ValidationError({"detail": "No anonymous codes found for this session."})

    existing_assignments = CorrectionAssignment.objects.filter(
        exam_subject_id=subject_id
    ).exists()
    if existing_assignments:
        raise ValidationError(
            {
                "detail": "Correctors already assigned for this subject. Delete existing assignments first."
            }
        )

    pair_count = len(correctors) // 2
    corrector_pairs = []
    for i in range(pair_count):
        corrector_pairs.append((correctors[2 * i], correctors[2 * i + 1]))
    if len(correctors) % 2 == 1:
        corrector_pairs.append((correctors[-2], correctors[-1]))

    created_count = 0
    with transaction.atomic():
        code_pairs = list(itertools.zip_longest(*[iter(anonymous_codes)] * 1))
        for idx, code in enumerate(anonymous_codes):
            pair = corrector_pairs[idx % len(corrector_pairs)]
            CorrectionAssignment.objects.create(
                anonymous_code=code,
                exam_subject_id=subject_id,
                corrector=pair[0],
                order=CorrectionOrder.FIRST,
            )
            CorrectionAssignment.objects.create(
                anonymous_code=code,
                exam_subject_id=subject_id,
                corrector=pair[1],
                order=CorrectionOrder.SECOND,
            )
            created_count += 2

    log_event(
        user=user,
        target=subject,
        action=ActionType.CREATE,
        details={
            "event": "CORRECTORS_ASSIGNED",
            "subject_id": subject_id,
            "corrector_count": len(correctors),
            "copies_count": len(anonymous_codes),
            "assignments_created": created_count,
        },
    )

    return {
        "subject_id": subject_id,
        "correctors": [c.email for c in correctors],
        "copies_assigned": len(anonymous_codes),
        "total_assignments": created_count,
    }


def get_corrector_assignments(corrector, subject_id: int = None) -> list[dict]:
    qs = CorrectionAssignment.objects.filter(corrector=corrector).select_related(
        "corrector"
    )
    if subject_id:
        qs = qs.filter(exam_subject_id=subject_id)

    return [
        {
            "id": a.id,
            "anonymous_code": a.anonymous_code,
            "exam_subject_id": a.exam_subject_id,
            "order": a.order,
        }
        for a in qs.order_by("id")
    ]


def get_corrector_copies(corrector, subject_id: int = None) -> list[dict]:
    qs = CorrectionAssignment.objects.filter(corrector=corrector)
    if subject_id:
        qs = qs.filter(exam_subject_id=subject_id)

    assigned_codes = list(qs.values_list("anonymous_code", flat=True).distinct())
    if not assigned_codes:
        return []

    from apps.anonymization.models import ExamCopy

    copies = ExamCopy.objects.filter(
        anonymous_code__code__in=assigned_codes
    ).select_related("anonymous_code")

    result = []
    for copy in copies.order_by("id"):
        entry = {
            "copy_id": copy.id,
            "anonymous_code": copy.anonymous_code.code,
            "file_url": copy.file.url if copy.file else None,
            "exam_subject_id": None,
        }
        if subject_id:
            entry["exam_subject_id"] = subject_id
        result.append(entry)

    return result


def delete_assignments(subject_id: int, user) -> dict:
    existing_grades = CopyGrade.objects.filter(exam_subject_id=subject_id).exists()
    if existing_grades:
        raise ValidationError(
            {
                "detail": "Cannot delete assignments: grades already exist for this subject."
            }
        )

    count, _ = CorrectionAssignment.objects.filter(exam_subject_id=subject_id).delete()

    log_event(
        user=user,
        action=ActionType.DELETE,
        target=None,
        details={
            "event": "CORRECTOR_ASSIGNMENTS_DELETED",
            "subject_id": subject_id,
            "deleted_count": count,
        },
    )

    return {"subject_id": subject_id, "deleted_count": count}


def submit_grade(
    anonymous_code: str,
    exam_subject_id: int,
    corrector,
    grade_value,
) -> CopyGrade:
    try:
        subject = ExamSubject.objects.get(pk=exam_subject_id)
    except ExamSubject.DoesNotExist:
        raise ValidationError(
            {"detail": f"ExamSubject with id {exam_subject_id} does not exist."}
        )

    grade_decimal = Decimal(str(grade_value))
    if grade_decimal < 0 or grade_decimal > subject.max_score:
        raise ValidationError(
            {"detail": f"Grade must be between 0 and {subject.max_score}."}
        )

    if SubjectGradeLock.objects.filter(exam_subject_id=exam_subject_id).exists():
        raise ValidationError(
            {"detail": "Grades are locked for this subject and cannot be submitted."}
        )

    assignment = CorrectionAssignment.objects.filter(
        anonymous_code=anonymous_code,
        exam_subject_id=exam_subject_id,
        corrector=corrector,
    ).first()
    if not assignment:
        raise ValidationError(
            {"detail": "You are not assigned to correct this copy for this subject."}
        )

    existing_grade = CopyGrade.objects.filter(
        anonymous_code=anonymous_code,
        exam_subject_id=exam_subject_id,
        corrector=corrector,
    ).first()
    if existing_grade:
        raise ValidationError(
            {"detail": "You have already submitted a grade for this copy."}
        )

    grade = CopyGrade.objects.create(
        anonymous_code=anonymous_code,
        exam_subject_id=exam_subject_id,
        corrector=corrector,
        grade=grade_decimal,
        correction_order=assignment.order,
    )

    log_event(
        user=corrector,
        target=grade,
        action=ActionType.CREATE,
        details={
            "event": "GRADE_SUBMITTED",
            "anonymous_code": anonymous_code,
            "exam_subject_id": exam_subject_id,
            "grade": str(grade_decimal),
            "correction_order": assignment.order,
        },
    )

    _check_for_discrepancy(anonymous_code, exam_subject_id, subject)

    return grade


def _check_for_discrepancy(
    anonymous_code: str, exam_subject_id: int, subject: ExamSubject
) -> None:
    grades = CopyGrade.objects.filter(
        anonymous_code=anonymous_code,
        exam_subject_id=exam_subject_id,
        correction_order__in=[CorrectionOrder.FIRST, CorrectionOrder.SECOND],
    )

    if grades.count() < 2:
        return

    grade_values = [g.grade for g in grades]
    difference = abs(grade_values[0] - grade_values[1])

    if difference > subject.discrepancy_threshold:
        GradeDiscrepancy.objects.create(
            anonymous_code=anonymous_code,
            exam_subject_id=exam_subject_id,
            difference=difference,
            is_resolved=False,
        )

        log_event(
            user=None,
            target=subject,
            action=ActionType.OTHER,
            details={
                "event": "GRADE_DISCREPANCY_DETECTED",
                "anonymous_code": anonymous_code,
                "exam_subject_id": exam_subject_id,
                "difference": str(difference),
                "threshold": str(subject.discrepancy_threshold),
            },
        )


def get_grades_for_copy(anonymous_code: str, exam_subject_id: int) -> list[dict]:
    grades = (
        CopyGrade.objects.filter(
            anonymous_code=anonymous_code,
            exam_subject_id=exam_subject_id,
        )
        .select_related("corrector")
        .order_by("correction_order")
    )

    return [
        {
            "id": g.id,
            "anonymous_code": g.anonymous_code,
            "exam_subject_id": g.exam_subject_id,
            "corrector_id": g.corrector_id,
            "corrector_email": g.corrector.email,
            "grade": str(g.grade),
            "correction_order": g.correction_order,
            "is_final": g.is_final,
        }
        for g in grades
    ]


def assign_third_corrector(
    discrepancy_id: int,
    third_corrector_id: int,
    user,
) -> CorrectionAssignment:
    try:
        discrepancy = GradeDiscrepancy.objects.get(pk=discrepancy_id)
    except GradeDiscrepancy.DoesNotExist:
        raise ValidationError(
            {"detail": f"GradeDiscrepancy with id {discrepancy_id} does not exist."}
        )

    if discrepancy.is_resolved:
        raise ValidationError({"detail": "This discrepancy is already resolved."})

    third_corrector = User.objects.filter(
        pk=third_corrector_id, role=RoleChoices.CORRECTOR, is_active=True
    ).first()
    if not third_corrector:
        raise ValidationError(
            {"detail": "Third corrector must be an active CORRECTOR user."}
        )

    existing = CorrectionAssignment.objects.filter(
        anonymous_code=discrepancy.anonymous_code,
        exam_subject_id=discrepancy.exam_subject_id,
        corrector=third_corrector,
    ).exists()
    if existing:
        raise ValidationError(
            {"detail": "This corrector is already assigned to this copy."}
        )

    assignment = CorrectionAssignment.objects.create(
        anonymous_code=discrepancy.anonymous_code,
        exam_subject_id=discrepancy.exam_subject_id,
        corrector=third_corrector,
        order=CorrectionOrder.THIRD,
    )

    log_event(
        user=user,
        target=assignment,
        action=ActionType.CREATE,
        details={
            "event": "THIRD_CORRECTOR_ASSIGNED",
            "discrepancy_id": discrepancy_id,
            "anonymous_code": discrepancy.anonymous_code,
            "exam_subject_id": discrepancy.exam_subject_id,
            "third_corrector_id": third_corrector_id,
        },
    )

    return assignment


def submit_third_grade(
    anonymous_code: str,
    exam_subject_id: int,
    corrector,
    grade_value,
) -> CopyGrade:
    assignment = CorrectionAssignment.objects.filter(
        anonymous_code=anonymous_code,
        exam_subject_id=exam_subject_id,
        corrector=corrector,
        order=CorrectionOrder.THIRD,
    ).first()
    if not assignment:
        raise ValidationError(
            {"detail": "You are not assigned as the third corrector for this copy."}
        )

    existing_grade = CopyGrade.objects.filter(
        anonymous_code=anonymous_code,
        exam_subject_id=exam_subject_id,
        corrector=corrector,
    ).first()
    if existing_grade:
        raise ValidationError(
            {"detail": "You have already submitted a grade for this copy."}
        )

    try:
        subject = ExamSubject.objects.get(pk=exam_subject_id)
    except ExamSubject.DoesNotExist:
        raise ValidationError(
            {"detail": f"ExamSubject with id {exam_subject_id} does not exist."}
        )

    grade_decimal = Decimal(str(grade_value))
    if grade_decimal < 0 or grade_decimal > subject.max_score:
        raise ValidationError(
            {"detail": f"Grade must be between 0 and {subject.max_score}."}
        )

    if SubjectGradeLock.objects.filter(exam_subject_id=exam_subject_id).exists():
        raise ValidationError(
            {"detail": "Grades are locked for this subject and cannot be submitted."}
        )

    grade = CopyGrade.objects.create(
        anonymous_code=anonymous_code,
        exam_subject_id=exam_subject_id,
        corrector=corrector,
        grade=grade_decimal,
        correction_order=CorrectionOrder.THIRD,
    )

    discrepancy = GradeDiscrepancy.objects.filter(
        anonymous_code=anonymous_code,
        exam_subject_id=exam_subject_id,
        is_resolved=False,
    ).first()
    if discrepancy:
        discrepancy.is_resolved = True
        discrepancy.resolution_note = f"Third corrector graded: {grade_decimal}"
        discrepancy.save()

    log_event(
        user=corrector,
        target=grade,
        action=ActionType.CREATE,
        details={
            "event": "THIRD_GRADE_SUBMITTED",
            "anonymous_code": anonymous_code,
            "exam_subject_id": exam_subject_id,
            "grade": str(grade_decimal),
            "discrepancy_resolved": discrepancy is not None,
        },
    )

    return grade


def compute_final_grades(subject_id: int, user) -> dict:
    try:
        subject = ExamSubject.objects.get(pk=subject_id)
    except ExamSubject.DoesNotExist:
        raise ValidationError(
            {"detail": f"ExamSubject with id {subject_id} does not exist."}
        )

    if SubjectGradeLock.objects.filter(exam_subject_id=subject_id).exists():
        raise ValidationError(
            {"detail": "Grades are locked for this subject. Cannot recompute."}
        )

    codes = (
        CopyGrade.objects.filter(exam_subject_id=subject_id)
        .values_list("anonymous_code", flat=True)
        .distinct()
    )

    if not codes:
        raise ValidationError({"detail": "No grades found for this subject."})

    results = []

    for code in codes:
        grades = list(
            CopyGrade.objects.filter(
                anonymous_code=code,
                exam_subject_id=subject_id,
            ).order_by("correction_order")
        )

        if len(grades) < 2:
            raise ValidationError(
                {"detail": f"Copy {code} does not have both initial grades yet."}
            )

        has_discrepancy = GradeDiscrepancy.objects.filter(
            anonymous_code=code,
            exam_subject_id=subject_id,
        ).exists()

        third_grade = None
        if has_discrepancy:
            third_grade = next(
                (g for g in grades if g.correction_order == CorrectionOrder.THIRD),
                None,
            )
            if not third_grade:
                raise ValidationError(
                    {
                        "detail": f"Copy {code} has an unresolved discrepancy. "
                        f"Assign a third corrector first."
                    }
                )

        final_grade_value = _compute_final(
            grades, third_grade, subject.final_grade_rule
        )

        CopyGrade.objects.filter(
            anonymous_code=code,
            exam_subject_id=subject_id,
        ).update(is_final=False)

        if third_grade and subject.final_grade_rule == FinalGradeRule.THIRD_CORRECTOR:
            third_grade.refresh_from_db()
            third_grade.is_final = True
            third_grade.save(update_fields=["is_final"])
        else:
            for g in grades:
                if g.correction_order in [
                    CorrectionOrder.FIRST,
                    CorrectionOrder.SECOND,
                ]:
                    g.is_final = True
                    g.save(update_fields=["is_final"])

        results.append(
            {
                "anonymous_code": code,
                "final_grade": str(final_grade_value),
                "rule_used": subject.final_grade_rule,
            }
        )

    log_event(
        user=user,
        target=subject,
        action=ActionType.UPDATE,
        details={
            "event": "FINAL_GRADES_COMPUTED",
            "subject_id": subject_id,
            "rule": subject.final_grade_rule,
            "copies_count": len(results),
        },
    )

    return {
        "subject_id": subject_id,
        "final_grade_rule": subject.final_grade_rule,
        "results": results,
    }


def _compute_final(
    grades: list,
    third_grade,
    rule: str,
) -> Decimal:
    first_two = [
        g
        for g in grades
        if g.correction_order in [CorrectionOrder.FIRST, CorrectionOrder.SECOND]
    ]
    values = [g.grade for g in first_two]

    if third_grade:
        values.append(third_grade.grade)

    if rule == FinalGradeRule.AVERAGE:
        avg = sum(values) / len(values)
        return avg.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    if rule == FinalGradeRule.MEDIAN:
        sorted_values = sorted(values)
        n = len(sorted_values)
        if n % 2 == 1:
            return sorted_values[n // 2].quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
        mid = (sorted_values[n // 2 - 1] + sorted_values[n // 2]) / 2
        return mid.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    if rule == FinalGradeRule.THIRD_CORRECTOR:
        if third_grade:
            return third_grade.grade.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        avg = sum(values) / len(values)
        return avg.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    avg = sum(values) / len(values)
    return avg.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def lock_subject_grades(subject_id: int, user) -> SubjectGradeLock:
    try:
        subject = ExamSubject.objects.get(pk=subject_id)
    except ExamSubject.DoesNotExist:
        raise ValidationError(
            {"detail": f"ExamSubject with id {subject_id} does not exist."}
        )

    if SubjectGradeLock.objects.filter(exam_subject_id=subject_id).exists():
        raise ValidationError({"detail": "Grades are already locked for this subject."})

    codes = (
        CopyGrade.objects.filter(exam_subject_id=subject_id)
        .values_list("anonymous_code", flat=True)
        .distinct()
    )
    if not codes:
        raise ValidationError({"detail": "No grades found for this subject."})

    for code in codes:
        first_two = CopyGrade.objects.filter(
            anonymous_code=code,
            exam_subject_id=subject_id,
            correction_order__in=[CorrectionOrder.FIRST, CorrectionOrder.SECOND],
        )
        if first_two.count() < 2:
            raise ValidationError(
                {"detail": f"Copy {code} does not have both initial grades yet."}
            )

        has_discrepancy = GradeDiscrepancy.objects.filter(
            anonymous_code=code,
            exam_subject_id=subject_id,
        ).exists()
        if has_discrepancy:
            has_third = CopyGrade.objects.filter(
                anonymous_code=code,
                exam_subject_id=subject_id,
                correction_order=CorrectionOrder.THIRD,
            ).exists()
            if not has_third:
                raise ValidationError(
                    {
                        "detail": f"Copy {code} has an unresolved discrepancy. "
                        f"Assign a third corrector first."
                    }
                )

        has_final = CopyGrade.objects.filter(
            anonymous_code=code,
            exam_subject_id=subject_id,
            is_final=True,
        ).exists()
        if not has_final:
            raise ValidationError(
                {
                    "detail": f"Copy {code} does not have final grades computed yet. "
                    f"Run compute-final-grades first."
                }
            )

    lock = SubjectGradeLock.objects.create(
        exam_subject_id=subject_id,
        locked_by=user,
    )

    subject.status = ExamSubjectStatus.LOCKED
    subject.save(update_fields=["status"])

    log_event(
        user=user,
        target=lock,
        action=ActionType.UPDATE,
        details={
            "event": "SUBJECT_GRADES_LOCKED",
            "subject_id": subject_id,
        },
    )

    return lock


def generate_correction_pv(subject_id: int, user):
    from django.core.files.base import ContentFile

    from apps.pv.models import PVDocument, PVType
    from apps.pv.services import _generate_document_identifier

    try:
        subject = ExamSubject.objects.get(pk=subject_id)
    except ExamSubject.DoesNotExist:
        raise ValidationError(
            {"detail": f"ExamSubject with id {subject_id} does not exist."}
        )

    if not SubjectGradeLock.objects.filter(exam_subject_id=subject_id).exists():
        raise ValidationError(
            {"detail": "Cannot generate PV: grades are not locked yet."}
        )

    codes = list(
        CopyGrade.objects.filter(exam_subject_id=subject_id)
        .values_list("anonymous_code", flat=True)
        .distinct()
    )

    content = (
        f"PV DE CORRECTION\n"
        f"=================\n"
        f"Session ID: {subject.exam_session_id}\n"
        f"Subject: {subject.name}\n"
        f"Coefficient: {subject.coefficient}\n"
        f"Max score: {subject.max_score}\n"
        f"Pass threshold: {subject.pass_threshold}\n"
        f"Final grade rule: {subject.final_grade_rule}\n"
        f"Discrepancy threshold: {subject.discrepancy_threshold}\n"
        f"-------------------\n"
        f"Total copies: {len(codes)}\n"
        f"-------------------\n"
    )

    discrepancies = GradeDiscrepancy.objects.filter(exam_subject_id=subject_id)
    content += f"Discrepancies: {discrepancies.count()}\n"
    resolved = discrepancies.filter(is_resolved=True).count()
    content += f"  Resolved: {resolved}\n"
    content += f"  Unresolved: {discrepancies.count() - resolved}\n"
    content += f"-------------------\nGrades:\n"

    for code in sorted(codes):
        grades = CopyGrade.objects.filter(
            anonymous_code=code,
            exam_subject_id=subject_id,
        ).order_by("correction_order")
        grade_strs = " | ".join(f"{g.correction_order}: {g.grade}" for g in grades)
        is_final_str = " [FINAL]" if grades.filter(is_final=True).exists() else ""
        content += f"  - {code}: {grade_strs}{is_final_str}\n"

    doc_id = _generate_document_identifier()
    pv = PVDocument.objects.create(
        pv_type=PVType.CORRECTION,
        exam_session_id=subject.exam_session_id,
        document_identifier=doc_id,
        generated_by=user,
    )
    pv.file.save(
        f"pv_correction_{subject_id}.txt", ContentFile(content.encode("utf-8"))
    )

    log_event(
        user=user,
        target=pv,
        action=ActionType.CREATE,
        details={
            "event": "PV_GENERATED",
            "pv_type": PVType.CORRECTION,
            "subject_id": subject_id,
            "copies_count": len(codes),
        },
    )

    return pv
