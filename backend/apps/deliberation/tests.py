from cryptography.fernet import Fernet
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import RoleChoices
from apps.anonymization.models import AnonymousCode, ExamCopy
from apps.candidates.models import Candidate, CandidateStatus
from apps.correction.models import (
    CorrectionAssignment,
    CorrectionOrder,
    CopyGrade,
    SubjectGradeLock,
)
from apps.examinations.models import (
    ExamRoom,
    ExamSession,
    ExamSessionStatus,
    ExamSubject,
    ExamSubjectStatus,
    FinalGradeRule,
)
from apps.pv.models import PVDocument, PVType, PVSignature

from .models import (
    DeliberationOutcome,
    DeliberationResult,
    DeliberationRun,
    DeliberationStatus,
)
from .services import (
    archive_deliberation,
    close_deliberation,
    compute_deliberation_results,
    generate_deliberation_pv,
    sign_pv,
)

User = get_user_model()

FERNET_KEY = Fernet.generate_key().decode()


class _BaseDeliberationTest(TestCase):
    databases = "__all__"

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@test.local", role=RoleChoices.ADMIN, is_active=True
        )
        self.jury_president = User.objects.create_user(
            email="jury_pres@test.local",
            role=RoleChoices.JURY_PRESIDENT,
            is_active=True,
        )
        self.jury_member = User.objects.create_user(
            email="jury_mem@test.local", role=RoleChoices.JURY_MEMBER, is_active=True
        )
        self.corrector1 = User.objects.create_user(
            email="corr1@test.local", role=RoleChoices.CORRECTOR, is_active=True
        )
        self.corrector2 = User.objects.create_user(
            email="corr2@test.local", role=RoleChoices.CORRECTOR, is_active=True
        )
        self.supervisor = User.objects.create_user(
            email="sup@test.local", role=RoleChoices.SUPERVISOR, is_active=True
        )

        self.session = ExamSession.objects.create(
            name="Automne 2026", year=2026, status=ExamSessionStatus.ACTIVE
        )
        self.subject1 = ExamSubject.objects.create(
            exam_session=self.session,
            name="Informatique",
            coefficient=2.0,
            pass_threshold=10.0,
            max_score=20.0,
            status=ExamSubjectStatus.LOCKED,
        )
        self.subject2 = ExamSubject.objects.create(
            exam_session=self.session,
            name="Mathematiques",
            coefficient=1.0,
            pass_threshold=10.0,
            max_score=20.0,
            status=ExamSubjectStatus.LOCKED,
        )
        self.room = ExamRoom.objects.create(
            exam_session=self.session, name="Salle A", capacity=10
        )

        self.c1 = Candidate.objects.create(
            national_id="N-01",
            first_name="Alice",
            last_name="Z",
            email="a@t.lo",
            phone="01",
            application_number="A-01",
            status=CandidateStatus.REGISTERED,
        )
        self.c2 = Candidate.objects.create(
            national_id="N-02",
            first_name="Bob",
            last_name="Y",
            email="b@t.lo",
            phone="02",
            application_number="A-02",
            status=CandidateStatus.REGISTERED,
        )
        self.c3 = Candidate.objects.create(
            national_id="N-03",
            first_name="Claire",
            last_name="X",
            email="c@t.lo",
            phone="03",
            application_number="A-03",
            status=CandidateStatus.REGISTERED,
        )

        self.code1 = AnonymousCode.objects.create(
            code="DOCT-2026-AB01",
            candidate_id_encrypted=Fernet(FERNET_KEY.encode())
            .encrypt(str(self.c1.id).encode())
            .decode(),
            exam_session_id=self.session.id,
        )
        self.code2 = AnonymousCode.objects.create(
            code="DOCT-2026-CD02",
            candidate_id_encrypted=Fernet(FERNET_KEY.encode())
            .encrypt(str(self.c2.id).encode())
            .decode(),
            exam_session_id=self.session.id,
        )
        self.code3 = AnonymousCode.objects.create(
            code="DOCT-2026-EF03",
            candidate_id_encrypted=Fernet(FERNET_KEY.encode())
            .encrypt(str(self.c3.id).encode())
            .decode(),
            exam_session_id=self.session.id,
        )

        for code in [self.code1, self.code2, self.code3]:
            copy = ExamCopy.objects.create(
                anonymous_code=code, uploaded_by_user_id=self.admin.id
            )
            copy.file.save(f"scan_{code.code}.pdf", ContentFile(b"fake"))

        SubjectGradeLock.objects.create(
            exam_subject_id=self.subject1.id, locked_by=self.admin
        )
        SubjectGradeLock.objects.create(
            exam_subject_id=self.subject2.id, locked_by=self.admin
        )

        self._seed_grades()

    def _seed_grades(self):
        for code_str in ["DOCT-2026-AB01", "DOCT-2026-CD02", "DOCT-2026-EF03"]:
            CorrectionAssignment.objects.create(
                anonymous_code=code_str,
                exam_subject_id=self.subject1.id,
                corrector=self.corrector1,
                order=CorrectionOrder.FIRST,
            )
            CorrectionAssignment.objects.create(
                anonymous_code=code_str,
                exam_subject_id=self.subject1.id,
                corrector=self.corrector2,
                order=CorrectionOrder.SECOND,
            )
            CorrectionAssignment.objects.create(
                anonymous_code=code_str,
                exam_subject_id=self.subject2.id,
                corrector=self.corrector1,
                order=CorrectionOrder.FIRST,
            )
            CorrectionAssignment.objects.create(
                anonymous_code=code_str,
                exam_subject_id=self.subject2.id,
                corrector=self.corrector2,
                order=CorrectionOrder.SECOND,
            )

        grades_data = {
            "DOCT-2026-AB01": {self.subject1.id: 14.0, self.subject2.id: 16.0},
            "DOCT-2026-CD02": {self.subject1.id: 10.0, self.subject2.id: 8.0},
            "DOCT-2026-EF03": {self.subject1.id: 4.0, self.subject2.id: 3.0},
        }
        for code_str, subject_grades in grades_data.items():
            for subj_id, grade_val in subject_grades.items():
                CopyGrade.objects.create(
                    anonymous_code=code_str,
                    exam_subject_id=subj_id,
                    corrector=self.corrector1,
                    grade=grade_val,
                    correction_order=CorrectionOrder.FIRST,
                    is_final=True,
                )
                CopyGrade.objects.create(
                    anonymous_code=code_str,
                    exam_subject_id=subj_id,
                    corrector=self.corrector2,
                    grade=grade_val,
                    correction_order=CorrectionOrder.SECOND,
                    is_final=True,
                )


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class ComputeDeliberationTests(_BaseDeliberationTest):
    def test_compute_creates_results(self):
        result = compute_deliberation_results(
            session_id=self.session.id, user=self.jury_president
        )
        self.assertEqual(result["results_count"], 3)
        self.assertTrue(
            DeliberationRun.objects.filter(exam_session_id=self.session.id).exists()
        )

    def test_weighted_average_computation(self):
        compute_deliberation_results(
            session_id=self.session.id, user=self.jury_president
        )
        ab01 = DeliberationResult.objects.get(anonymous_code="DOCT-2026-AB01")
        expected = (
            Decimal("14.0") * Decimal("2.0") + Decimal("16.0") * Decimal("1.0")
        ) / Decimal("3.0")
        self.assertEqual(ab01.weighted_average, expected.quantize(Decimal("0.01")))

    def test_ranking_by_weighted_average(self):
        compute_deliberation_results(
            session_id=self.session.id, user=self.jury_president
        )
        results = list(DeliberationResult.objects.all().order_by("rank"))
        self.assertEqual(results[0].anonymous_code, "DOCT-2026-AB01")
        self.assertEqual(results[0].rank, 1)
        self.assertEqual(results[-1].anonymous_code, "DOCT-2026-EF03")

    def test_admitted_outcome(self):
        compute_deliberation_results(
            session_id=self.session.id, user=self.jury_president
        )
        ab01 = DeliberationResult.objects.get(anonymous_code="DOCT-2026-AB01")
        self.assertEqual(ab01.outcome, DeliberationOutcome.ADMITTED)

    def test_rejected_outcome(self):
        compute_deliberation_results(
            session_id=self.session.id, user=self.jury_president
        )
        ef03 = DeliberationResult.objects.get(anonymous_code="DOCT-2026-EF03")
        self.assertEqual(ef03.outcome, DeliberationOutcome.REJECTED)

    def test_waiting_list_outcome(self):
        run = DeliberationRun.objects.create(
            exam_session_id=self.session.id,
            admission_threshold=Decimal("10.00"),
            waiting_list_capacity=1,
        )
        compute_deliberation_results(
            session_id=self.session.id, user=self.jury_president
        )
        cd02 = DeliberationResult.objects.get(anonymous_code="DOCT-2026-CD02")
        self.assertEqual(cd02.outcome, DeliberationOutcome.WAITING_LIST)

    def test_compute_requires_locked_subjects(self):
        SubjectGradeLock.objects.filter(exam_subject_id=self.subject2.id).delete()
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            compute_deliberation_results(
                session_id=self.session.id, user=self.jury_president
            )
        self.assertIn("not locked", str(ctx.exception.detail))

    def test_compute_replaces_previous_results(self):
        compute_deliberation_results(
            session_id=self.session.id, user=self.jury_president
        )
        first_count = DeliberationResult.objects.count()
        compute_deliberation_results(
            session_id=self.session.id, user=self.jury_president
        )
        self.assertEqual(DeliberationResult.objects.count(), first_count)

    def test_compute_blocked_if_closed(self):
        compute_deliberation_results(
            session_id=self.session.id, user=self.jury_president
        )
        run = DeliberationRun.objects.get(exam_session_id=self.session.id)
        close_deliberation(deliberation_id=run.id, user=self.jury_president)
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            compute_deliberation_results(
                session_id=self.session.id, user=self.jury_president
            )
        self.assertIn("already closed", str(ctx.exception.detail))

    def test_compute_endpoint(self):
        run = DeliberationRun.objects.create(exam_session_id=self.session.id)
        self.client.force_authenticate(user=self.jury_president)
        response = self.client.post(
            f"/api/deliberation/runs/{run.id}/compute/", format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results_count"], 3)


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class CloseAndLiftAnonymityTests(_BaseDeliberationTest):
    def setUp(self):
        super().setUp()
        compute_deliberation_results(
            session_id=self.session.id, user=self.jury_president
        )
        self.run = DeliberationRun.objects.get(exam_session_id=self.session.id)

    def test_close_deliberation(self):
        closed = close_deliberation(
            deliberation_id=self.run.id, user=self.jury_president
        )
        self.assertEqual(closed.status, DeliberationStatus.CLOSED)
        self.assertIsNotNone(closed.closed_at)

    def test_anonymity_lifted_on_close(self):
        close_deliberation(deliberation_id=self.run.id, user=self.jury_president)
        ab01 = DeliberationResult.objects.get(anonymous_code="DOCT-2026-AB01")
        self.assertEqual(ab01.candidate_id, self.c1.id)

    def test_close_requires_results(self):
        DeliberationResult.objects.filter(deliberation=self.run).delete()
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            close_deliberation(deliberation_id=self.run.id, user=self.jury_president)
        self.assertIn("No results", str(ctx.exception.detail))

    def test_double_close_rejected(self):
        close_deliberation(deliberation_id=self.run.id, user=self.jury_president)
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            close_deliberation(deliberation_id=self.run.id, user=self.jury_president)
        self.assertIn("already closed", str(ctx.exception.detail))

    def test_close_endpoint(self):
        self.client.force_authenticate(user=self.jury_president)
        response = self.client.post(
            f"/api/deliberation/runs/{self.run.id}/close/", format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.run.refresh_from_db()
        self.assertEqual(self.run.status, DeliberationStatus.CLOSED)

    def test_reopen_blocked_if_archived(self):
        close_deliberation(deliberation_id=self.run.id, user=self.jury_president)
        archive_deliberation(deliberation_id=self.run.id, user=self.admin)
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f"/api/deliberation/runs/{self.run.id}/reopen/",
            {"reason": "Emergency"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class DeliberationPVTests(_BaseDeliberationTest):
    def setUp(self):
        super().setUp()
        compute_deliberation_results(
            session_id=self.session.id, user=self.jury_president
        )
        self.run = DeliberationRun.objects.get(exam_session_id=self.session.id)
        close_deliberation(deliberation_id=self.run.id, user=self.jury_president)

    def test_generate_pv(self):
        pv = generate_deliberation_pv(
            deliberation_id=self.run.id, user=self.jury_president
        )
        self.assertEqual(pv.pv_type, PVType.DELIBERATION)
        self.assertTrue(pv.file)

    def test_pv_content_includes_results(self):
        pv = generate_deliberation_pv(
            deliberation_id=self.run.id, user=self.jury_president
        )
        content = pv.file.read().decode("utf-8")
        self.assertIn("PV DE DELIBERATION", content)
        self.assertIn("DOCT-2026-AB01", content)
        self.assertIn("ADMITTED", content)

    def test_pv_requires_close(self):
        run2 = DeliberationRun.objects.create(
            exam_session_id=99999, status=DeliberationStatus.OPEN
        )
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            generate_deliberation_pv(deliberation_id=run2.id, user=self.jury_president)
        self.assertIn("not closed", str(ctx.exception.detail))

    def test_generate_pv_endpoint(self):
        self.client.force_authenticate(user=self.jury_president)
        response = self.client.post(
            f"/api/deliberation/runs/{self.run.id}/generate-pv/", format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["pv_type"], "DELIBERATION")


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class SignAndArchiveTests(_BaseDeliberationTest):
    def setUp(self):
        super().setUp()
        compute_deliberation_results(
            session_id=self.session.id, user=self.jury_president
        )
        self.run = DeliberationRun.objects.get(exam_session_id=self.session.id)
        close_deliberation(deliberation_id=self.run.id, user=self.jury_president)
        self.pv = generate_deliberation_pv(
            deliberation_id=self.run.id, user=self.jury_president
        )

    def test_sign_pv(self):
        signature = sign_pv(pv_document_id=self.pv.id, signer_user=self.jury_president)
        self.assertEqual(signature.pv_document_id, self.pv.id)
        self.assertEqual(signature.signer_user, self.jury_president)

    def test_duplicate_sign_rejected(self):
        sign_pv(pv_document_id=self.pv.id, signer_user=self.jury_president)
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            sign_pv(pv_document_id=self.pv.id, signer_user=self.jury_president)
        self.assertIn("already signed", str(ctx.exception.detail))

    def test_non_jury_sign_rejected(self):
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            sign_pv(pv_document_id=self.pv.id, signer_user=self.corrector1)
        self.assertIn("can sign", str(ctx.exception.detail))

    def test_sign_endpoint(self):
        self.client.force_authenticate(user=self.jury_president)
        response = self.client.post(
            "/api/deliberation/sign-pv/",
            {"pv_document_id": self.pv.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_archive_deliberation(self):
        archived = archive_deliberation(deliberation_id=self.run.id, user=self.admin)
        self.assertTrue(archived.is_archived)
        self.pv.refresh_from_db()
        self.assertTrue(self.pv.is_archived)

    def test_archive_requires_close(self):
        run2 = DeliberationRun.objects.create(
            exam_session_id=99999, status=DeliberationStatus.OPEN
        )
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            archive_deliberation(deliberation_id=run2.id, user=self.admin)
        self.assertIn("closed", str(ctx.exception.detail))

    def test_double_archive_rejected(self):
        archive_deliberation(deliberation_id=self.run.id, user=self.admin)
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            archive_deliberation(deliberation_id=self.run.id, user=self.admin)
        self.assertIn("already archived", str(ctx.exception.detail))

    def test_archive_endpoint(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f"/api/deliberation/runs/{self.run.id}/archive/", format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.run.refresh_from_db()
        self.assertTrue(self.run.is_archived)
