from datetime import date, time
from decimal import Decimal

from django.core.files.base import ContentFile
from django.utils import timezone

from apps.accounts.models import RoleChoices, User
from apps.anonymization.models import AnonymousCode, ExamCopy
from apps.anonymization.services import (
    decrypt_candidate_id,
    generate_anonymization_pv,
    upload_and_code_copy,
)
from apps.attendance.models import AttendanceRecord, AttendanceStatus, AttendanceSubmission
from apps.attendance.services import finalize_attendance
from apps.candidates.models import Candidate, CandidateStatus
from apps.correction.models import (
    CopyGrade,
    CorrectionAssignment,
    CorrectionOrder,
    GradeDiscrepancy,
    SubjectGradeLock,
)
from apps.correction.services import (
    assign_correctors,
    assign_third_corrector,
    compute_final_grades,
    generate_correction_pv,
    lock_subject_grades,
    submit_grade,
    submit_third_grade,
)
from apps.deliberation.models import DeliberationRun, DeliberationStatus
from apps.deliberation.services import (
    archive_deliberation,
    close_deliberation,
    compute_deliberation_results,
    generate_deliberation_pv,
    sign_pv,
)
from apps.examinations.models import (
    ExamAllocation,
    ExamRoom,
    ExamSession,
    ExamSessionStatus,
    ExamSubject,
    ExamSubjectStatus,
    FinalGradeRule,
    SubjectSchedule,
)
from apps.pv.models import PVDocument, PVSignature, PVType


ADMIN_PASSWORD = "StrongPass123!"
ROLE_PASSWORD = "RolePass123!"
SESSION_NAME = "Presentation Demo Session"
SESSION_YEAR = 2027


def ensure_user(email, role, first_name, last_name, password=ROLE_PASSWORD):
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "role": role,
            "first_name": first_name,
            "last_name": last_name,
            "is_active": True,
            "is_staff": role == RoleChoices.ADMIN,
            "is_superuser": role == RoleChoices.ADMIN,
        },
    )
    user.role = role
    user.first_name = first_name
    user.last_name = last_name
    user.is_active = True
    if role == RoleChoices.ADMIN:
        user.is_staff = True
        user.is_superuser = True
    user.set_password(password)
    user.save()
    return user, created


def first_or_create(model, defaults=None, **lookup):
    obj = model.objects.filter(**lookup).first()
    if obj:
        return obj, False
    return model.objects.create(**lookup, **(defaults or {})), True


def get_candidate_for_code(code):
    anon = AnonymousCode.objects.get(code=code)
    candidate_id = decrypt_candidate_id(anon.candidate_id_encrypted)
    return Candidate.objects.get(id=candidate_id)


def main():
    users = {}
    role_specs = [
        ("admin@concours.local", RoleChoices.ADMIN, "Admin", "Demo", ADMIN_PASSWORD),
        ("cfd@test.local", RoleChoices.CFD_HEAD, "CFD", "Head", ROLE_PASSWORD),
        ("coordinator@test.local", RoleChoices.COORDINATOR, "Correction", "Coordinator", ROLE_PASSWORD),
        ("corrector1@test.local", RoleChoices.CORRECTOR, "First", "Corrector", ROLE_PASSWORD),
        ("corrector2@test.local", RoleChoices.CORRECTOR, "Second", "Corrector", ROLE_PASSWORD),
        ("corrector3@test.local", RoleChoices.CORRECTOR, "Third", "Corrector", ROLE_PASSWORD),
        ("supervisor@test.local", RoleChoices.SUPERVISOR, "Room", "Supervisor", ROLE_PASSWORD),
        ("jury.president@test.local", RoleChoices.JURY_PRESIDENT, "Jury", "President", ROLE_PASSWORD),
        ("jury.member@test.local", RoleChoices.JURY_MEMBER, "Jury", "Member", ROLE_PASSWORD),
        ("anon@test.local", RoleChoices.ANONYMITY_COMMISSION, "Anonymity", "Commission", ROLE_PASSWORD),
    ]
    for email, role, first_name, last_name, password in role_specs:
        users[email], _ = ensure_user(email, role, first_name, last_name, password)

    admin = users["admin@concours.local"]
    supervisor = users["supervisor@test.local"]
    anon_user = users["anon@test.local"]
    coordinator = users["coordinator@test.local"]
    corrector1 = users["corrector1@test.local"]
    corrector2 = users["corrector2@test.local"]
    corrector3 = users["corrector3@test.local"]
    jury_president = users["jury.president@test.local"]
    jury_member = users["jury.member@test.local"]

    session, _ = ExamSession.objects.get_or_create(
        name=SESSION_NAME,
        year=SESSION_YEAR,
        defaults={
            "status": ExamSessionStatus.ACTIVE,
            "starts_at": date(2027, 6, 1),
            "ends_at": date(2027, 6, 5),
        },
    )
    session.status = ExamSessionStatus.ACTIVE
    session.starts_at = date(2027, 6, 1)
    session.ends_at = date(2027, 6, 5)
    session.save(update_fields=["status", "starts_at", "ends_at", "updated_at"])

    subject_specs = [
        ("Advanced Algorithms", Decimal("2.00"), date(2027, 6, 2), time(9, 0), 120),
        ("Data Systems", Decimal("1.00"), date(2027, 6, 3), time(9, 0), 120),
    ]
    subjects = []
    for name, coeff, _, _, _ in subject_specs:
        subject, _ = ExamSubject.objects.get_or_create(
            exam_session=session,
            name=name,
            defaults={
                "coefficient": coeff,
                "max_score": Decimal("20.00"),
                "pass_threshold": Decimal("10.00"),
                "discrepancy_threshold": Decimal("3.00"),
                "final_grade_rule": FinalGradeRule.AVERAGE,
                "status": ExamSubjectStatus.ACTIVE,
            },
        )
        if not SubjectGradeLock.objects.filter(exam_subject_id=subject.id).exists():
            subject.status = ExamSubjectStatus.ACTIVE
        subject.coefficient = coeff
        subject.max_score = Decimal("20.00")
        subject.pass_threshold = Decimal("10.00")
        subject.discrepancy_threshold = Decimal("3.00")
        subject.final_grade_rule = FinalGradeRule.AVERAGE
        subject.save()
        subjects.append(subject)

    room, _ = ExamRoom.objects.get_or_create(
        exam_session=session,
        name="Presentation Room A",
        defaults={"capacity": 32},
    )
    room.capacity = 32
    room.save(update_fields=["capacity", "updated_at"])

    schedules = []
    for subject, (_, _, exam_date, start_time, duration) in zip(subjects, subject_specs):
        schedule, _ = SubjectSchedule.objects.get_or_create(
            subject=subject,
            room=room,
            exam_date=exam_date,
            start_time=start_time,
            defaults={"duration_minutes": duration},
        )
        schedule.duration_minutes = duration
        schedule.save(update_fields=["duration_minutes", "updated_at"])
        schedules.append(schedule)

    candidates = []
    candidate_specs = [
        ("PRES-2027-001", "NIDP2027001", "Sara", "Benali", "sara.benali@example.test", "0550000001", True),
        ("PRES-2027-002", "NIDP2027002", "Yacine", "Mansouri", "yacine.mansouri@example.test", "0550000002", True),
        ("PRES-2027-003", "NIDP2027003", "Lina", "Haddad", "lina.haddad@example.test", "0550000003", True),
        ("PRES-2027-004", "NIDP2027004", "Karim", "Brahimi", "karim.brahimi@example.test", "0550000004", True),
        ("PRES-2027-005", "NIDP2027005", "Nour", "Saidi", "nour.saidi@example.test", "0550000005", True),
        ("PRES-2027-006", "NIDP2027006", "Amine", "Kaci", "amine.kaci@example.test", "0550000006", True),
        ("PRES-2027-007", "NIDP2027007", "Meriem", "Ziani", "meriem.ziani@example.test", "0550000007", False),
        ("PRES-2027-008", "NIDP2027008", "Omar", "Dahmani", "omar.dahmani@example.test", "0550000008", False),
    ]
    present_applications = {spec[0] for spec in candidate_specs if spec[-1]}
    for app_no, national_id, first, last, email, phone, _present in candidate_specs:
        candidate, _ = Candidate.objects.get_or_create(
            application_number=app_no,
            defaults={
                "national_id": national_id,
                "first_name": first,
                "last_name": last,
                "email": email,
                "phone": phone,
                "status": CandidateStatus.REGISTERED,
                "is_active": True,
            },
        )
        candidate.national_id = national_id
        candidate.first_name = first
        candidate.last_name = last
        candidate.email = email
        candidate.phone = phone
        candidate.is_active = True
        candidate.save()
        candidates.append(candidate)

    for schedule in schedules:
        for seat, candidate in enumerate(candidates, start=1):
            ExamAllocation.objects.get_or_create(
                candidate=candidate,
                subject_schedule=schedule,
                defaults={"seat_number": seat},
            )

    for schedule in schedules:
        submission, _ = AttendanceSubmission.objects.get_or_create(
            exam_schedule=schedule,
            defaults={
                "submitted_by": supervisor,
                "submitted_at": timezone.now(),
                "incidents": "Presentation demo: attendance fully marked.",
            },
        )
        if not submission.is_finalized:
            submission.submitted_by = supervisor
            submission.submitted_at = timezone.now()
            submission.incidents = "Presentation demo: attendance fully marked."
            submission.save()
            for candidate in candidates:
                status = (
                    AttendanceStatus.PRESENT
                    if candidate.application_number in present_applications
                    else AttendanceStatus.ABSENT
                )
                AttendanceRecord.objects.update_or_create(
                    submission=submission,
                    candidate=candidate,
                    defaults={"status": status, "marked_by": supervisor},
                )
            finalize_attendance(submission, supervisor)

    Candidate.objects.filter(application_number__in=present_applications).update(
        status=CandidateStatus.PRESENT
    )
    Candidate.objects.filter(
        application_number__in=[
            spec[0] for spec in candidate_specs if spec[0] not in present_applications
        ]
    ).update(status=CandidateStatus.ELIMINATED)

    for candidate in candidates:
        if candidate.application_number not in present_applications:
            continue
        already_coded = False
        for anon in AnonymousCode.objects.filter(exam_session_id=session.id):
            try:
                if decrypt_candidate_id(anon.candidate_id_encrypted) == candidate.id:
                    already_coded = True
                    break
            except Exception:
                pass
        if not already_coded:
            content = f"Presentation demo scan for {candidate.application_number}\n"
            upload_and_code_copy(
                session.id,
                candidate.application_number,
                ContentFile(content.encode("utf-8"), name=f"{candidate.application_number}.txt"),
                anon_user,
            )

    if not PVDocument.objects.filter(
        pv_type=PVType.ANONYMIZATION, exam_session_id=session.id
    ).exists():
        generate_anonymization_pv(session.id, anon_user)

    codes = list(AnonymousCode.objects.filter(exam_session_id=session.id).order_by("id"))
    code_to_candidate = {anon.code: get_candidate_for_code(anon.code) for anon in codes}

    if session.lottery_subject_id is None:
        session.lottery_subject = subjects[0]
        session.save(update_fields=["lottery_subject", "updated_at"])

    grade_plan = {
        "PRES-2027-001": {
            "Advanced Algorithms": (Decimal("17.00"), Decimal("18.00"), None),
            "Data Systems": (Decimal("16.00"), Decimal("17.00"), None),
        },
        "PRES-2027-002": {
            "Advanced Algorithms": (Decimal("15.00"), Decimal("15.00"), None),
            "Data Systems": (Decimal("14.00"), Decimal("15.00"), None),
        },
        "PRES-2027-003": {
            "Advanced Algorithms": (Decimal("10.00"), Decimal("16.00"), Decimal("13.00")),
            "Data Systems": (Decimal("11.00"), Decimal("12.00"), None),
        },
        "PRES-2027-004": {
            "Advanced Algorithms": (Decimal("10.00"), Decimal("10.00"), None),
            "Data Systems": (Decimal("10.00"), Decimal("10.00"), None),
        },
        "PRES-2027-005": {
            "Advanced Algorithms": (Decimal("8.00"), Decimal("9.00"), None),
            "Data Systems": (Decimal("9.00"), Decimal("9.00"), None),
        },
        "PRES-2027-006": {
            "Advanced Algorithms": (Decimal("5.00"), Decimal("6.00"), None),
            "Data Systems": (Decimal("6.00"), Decimal("6.00"), None),
        },
    }

    for subject in subjects:
        if not CorrectionAssignment.objects.filter(exam_subject_id=subject.id).exists():
            assign_correctors(subject.id, [corrector1.id, corrector2.id], coordinator)

        for anon in codes:
            candidate = code_to_candidate[anon.code]
            if candidate.application_number not in grade_plan:
                continue
            first_grade, second_grade, _third_grade = grade_plan[candidate.application_number][subject.name]
            for corrector, value in ((corrector1, first_grade), (corrector2, second_grade)):
                if not CopyGrade.objects.filter(
                    anonymous_code=anon.code,
                    exam_subject_id=subject.id,
                    corrector=corrector,
                ).exists():
                    submit_grade(anon.code, subject.id, corrector, value)

        for discrepancy in GradeDiscrepancy.objects.filter(
            exam_subject_id=subject.id,
            is_resolved=False,
        ):
            candidate = code_to_candidate[discrepancy.anonymous_code]
            third_value = grade_plan[candidate.application_number][subject.name][2]
            if third_value is None:
                continue
            if not CorrectionAssignment.objects.filter(
                anonymous_code=discrepancy.anonymous_code,
                exam_subject_id=subject.id,
                order=CorrectionOrder.THIRD,
            ).exists():
                assign_third_corrector(discrepancy.id, corrector3.id, coordinator)
            if not CopyGrade.objects.filter(
                anonymous_code=discrepancy.anonymous_code,
                exam_subject_id=subject.id,
                corrector=corrector3,
            ).exists():
                submit_third_grade(discrepancy.anonymous_code, subject.id, corrector3, third_value)

        if not SubjectGradeLock.objects.filter(exam_subject_id=subject.id).exists():
            compute_final_grades(subject.id, coordinator)
            lock_subject_grades(subject.id, coordinator)

    existing_correction_pvs = PVDocument.objects.filter(
        pv_type=PVType.CORRECTION,
        exam_session_id=session.id,
    ).count()
    if existing_correction_pvs < len(subjects):
        for subject in subjects:
            generate_correction_pv(subject.id, coordinator)

    deliberation, _ = DeliberationRun.objects.get_or_create(
        exam_session_id=session.id,
        defaults={
            "status": DeliberationStatus.OPEN,
            "admission_threshold": Decimal("12.00"),
            "waiting_list_capacity": 2,
        },
    )
    if deliberation.status != DeliberationStatus.CLOSED:
        deliberation.admission_threshold = Decimal("12.00")
        deliberation.waiting_list_capacity = 2
        deliberation.save(update_fields=["admission_threshold", "waiting_list_capacity", "updated_at"])
        compute_deliberation_results(session.id, jury_president)
        close_deliberation(deliberation.id, jury_president)

    if not PVDocument.objects.filter(
        pv_type=PVType.DELIBERATION,
        exam_session_id=session.id,
    ).exists():
        generate_deliberation_pv(deliberation.id, jury_president)

    pv = PVDocument.objects.filter(
        pv_type=PVType.DELIBERATION,
        exam_session_id=session.id,
    ).order_by("-generated_at").first()
    for signer in (jury_president, jury_member, admin):
        if not PVSignature.objects.filter(pv_document=pv, signer_user=signer).exists():
            sign_pv(pv.id, signer)

    deliberation.refresh_from_db()
    if not deliberation.is_archived:
        archive_deliberation(deliberation.id, jury_president)

    session.status = ExamSessionStatus.CLOSED
    session.save(update_fields=["status", "updated_at"])

    copied_count = ExamCopy.objects.filter(anonymous_code__exam_session_id=session.id).count()
    print("Presentation demo seeded")
    print(f"Session: {session.name} ({session.year}) id={session.id} status={session.status}")
    print(f"Users: {User.objects.count()} total")
    print(f"Demo candidates: {len(candidates)} total, {len(present_applications)} present, 2 eliminated")
    print(f"Subjects: {len(subjects)} locked")
    print(f"Anonymous copies: {copied_count}")
    print(f"Deliberation: id={deliberation.id} status={deliberation.status} archived={deliberation.is_archived}")
    print(f"PVs for session: {PVDocument.objects.filter(exam_session_id=session.id).count()}")


main()
