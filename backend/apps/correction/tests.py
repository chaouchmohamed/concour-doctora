from cryptography.fernet import Fernet
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import RoleChoices
from apps.candidates.models import Candidate, CandidateStatus
from apps.examinations.models import (
    ExamRoom,
    ExamSession,
    ExamSessionStatus,
    ExamSubject,
    ExamSubjectStatus,
    FinalGradeRule,
)

from apps.anonymization.models import AnonymousCode, ExamCopy

from .models import (
    CorrectionAssignment,
    CorrectionOrder,
    CopyGrade,
    GradeDiscrepancy,
    SubjectGradeLock,
)
from .services import (
    assign_correctors,
    assign_third_corrector,
    compute_final_grades,
    delete_assignments,
    generate_correction_pv,
    get_corrector_assignments,
    get_corrector_copies,
    lock_subject_grades,
    submit_grade,
    submit_third_grade,
)

User = get_user_model()

FERNET_KEY = Fernet.generate_key().decode()


class _BaseCorrectionTest(TestCase):
    databases = "__all__"

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@test.local", role=RoleChoices.ADMIN, is_active=True
        )
        self.coordinator = User.objects.create_user(
            email="coord@test.local", role=RoleChoices.COORDINATOR, is_active=True
        )
        self.corrector1 = User.objects.create_user(
            email="corr1@test.local", role=RoleChoices.CORRECTOR, is_active=True
        )
        self.corrector2 = User.objects.create_user(
            email="corr2@test.local", role=RoleChoices.CORRECTOR, is_active=True
        )
        self.corrector3 = User.objects.create_user(
            email="corr3@test.local", role=RoleChoices.CORRECTOR, is_active=True
        )
        self.supervisor = User.objects.create_user(
            email="sup@test.local", role=RoleChoices.SUPERVISOR, is_active=True
        )

        self.session = ExamSession.objects.create(
            name="Automne 2026", year=2026, status=ExamSessionStatus.ACTIVE
        )
        self.subject = ExamSubject.objects.create(
            exam_session=self.session,
            name="Informatique",
            coefficient=1.0,
            pass_threshold=10.0,
            max_score=20.0,
        )
        self.room = ExamRoom.objects.create(
            exam_session=self.session, name="Salle A", capacity=10
        )

        self.c1 = Candidate.objects.create(
            national_id="N-01",
            first_name="A",
            last_name="A",
            email="a@t.lo",
            phone="01",
            application_number="A-01",
            status=CandidateStatus.REGISTERED,
        )
        self.c2 = Candidate.objects.create(
            national_id="N-02",
            first_name="B",
            last_name="B",
            email="b@t.lo",
            phone="02",
            application_number="A-02",
            status=CandidateStatus.REGISTERED,
        )

        self.code1 = AnonymousCode.objects.create(
            code="DOCT-2026-AB01",
            candidate_id_encrypted=Fernet(FERNET_KEY.encode()).encrypt(b"1").decode(),
            exam_session_id=self.session.id,
        )
        self.code2 = AnonymousCode.objects.create(
            code="DOCT-2026-CD02",
            candidate_id_encrypted=Fernet(FERNET_KEY.encode()).encrypt(b"2").decode(),
            exam_session_id=self.session.id,
        )

        self.copy1 = ExamCopy.objects.create(
            anonymous_code=self.code1,
            uploaded_by_user_id=self.admin.id,
        )
        self.copy1.file.save("scan1.pdf", ContentFile(b"fake-scan-1"))
        self.copy2 = ExamCopy.objects.create(
            anonymous_code=self.code2,
            uploaded_by_user_id=self.admin.id,
        )
        self.copy2.file.save("scan2.pdf", ContentFile(b"fake-scan-2"))


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class AssignCorrectorsServiceTests(_BaseCorrectionTest):
    def test_assign_two_correctors(self):
        result = assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        self.assertEqual(result["copies_assigned"], 2)
        self.assertEqual(result["total_assignments"], 4)

        for code_str in ["DOCT-2026-AB01", "DOCT-2026-CD02"]:
            assignments = CorrectionAssignment.objects.filter(
                anonymous_code=code_str, exam_subject_id=self.subject.id
            )
            self.assertEqual(assignments.count(), 2)
            orders = set(assignments.values_list("order", flat=True))
            self.assertEqual(orders, {CorrectionOrder.FIRST, CorrectionOrder.SECOND})

    def test_assign_requires_at_least_two_correctors(self):
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            assign_correctors(
                subject_id=self.subject.id,
                corrector_ids=[self.corrector1.id],
                user=self.coordinator,
            )

    def test_assign_requires_corrector_role(self):
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            assign_correctors(
                subject_id=self.subject.id,
                corrector_ids=[self.corrector1.id, self.supervisor.id],
                user=self.coordinator,
            )

    def test_assign_blocked_when_grades_exist(self):
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        CopyGrade.objects.create(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade=12.00,
            correction_order=CorrectionOrder.FIRST,
        )

        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            assign_correctors(
                subject_id=self.subject.id,
                corrector_ids=[self.corrector1.id, self.corrector2.id],
                user=self.coordinator,
            )

    def test_assign_blocked_when_already_assigned(self):
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )

        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            assign_correctors(
                subject_id=self.subject.id,
                corrector_ids=[self.corrector1.id, self.corrector2.id],
                user=self.coordinator,
            )

    def test_assign_with_three_correctors(self):
        result = assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id, self.corrector3.id],
            user=self.coordinator,
        )
        self.assertEqual(result["copies_assigned"], 2)
        assigned_correctors = set(
            CorrectionAssignment.objects.filter(
                exam_subject_id=self.subject.id
            ).values_list("corrector_id", flat=True)
        )
        self.assertTrue(len(assigned_correctors) >= 2)

    def test_assign_invalid_subject(self):
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            assign_correctors(
                subject_id=99999,
                corrector_ids=[self.corrector1.id, self.corrector2.id],
                user=self.coordinator,
            )


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class CorrectorAssignmentViewTests(_BaseCorrectionTest):
    def test_assign_endpoint_coordinator(self):
        self.client.force_authenticate(user=self.coordinator)
        response = self.client.post(
            "/api/correction/assignments/assign/",
            {
                "subject_id": self.subject.id,
                "corrector_ids": [self.corrector1.id, self.corrector2.id],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["copies_assigned"], 2)

    def test_assign_endpoint_corrector_forbidden(self):
        self.client.force_authenticate(user=self.corrector1)
        response = self.client.post(
            "/api/correction/assignments/assign/",
            {
                "subject_id": self.subject.id,
                "corrector_ids": [self.corrector1.id, self.corrector2.id],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_corrector_sees_only_own_assignments(self):
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        self.client.force_authenticate(user=self.corrector1)
        response = self.client.get("/api/correction/assignments/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in (
            response.data["results"] if "results" in response.data else response.data
        ):
            self.assertEqual(item["corrector"], self.corrector1.id)

    def test_admin_sees_all_assignments(self):
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/correction/assignments/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = (
            response.data["results"] if "results" in response.data else response.data
        )
        self.assertEqual(len(results), 4)


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class CorrectorCopyViewTests(_BaseCorrectionTest):
    def test_corrector_gets_assigned_copies(self):
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        self.client.force_authenticate(user=self.corrector1)
        response = self.client.get("/api/correction/my-copies/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        codes_in_response = [c["anonymous_code"] for c in response.data]
        self.assertIn("DOCT-2026-AB01", codes_in_response)
        self.assertIn("DOCT-2026-CD02", codes_in_response)

    def test_corrector_copies_include_file_url(self):
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        self.client.force_authenticate(user=self.corrector1)
        response = self.client.get("/api/correction/my-copies/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data:
            self.assertIsNotNone(item["file_url"])

    def test_corrector_no_unassigned_copies(self):
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        self.client.force_authenticate(user=self.corrector3)
        response = self.client.get("/api/correction/my-copies/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_non_corrector_forbidden(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/correction/my-copies/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_corrector_copies_filter_by_subject(self):
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        self.client.force_authenticate(user=self.corrector1)
        response = self.client.get(
            f"/api/correction/my-copies/?subject_id={self.subject.id}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)
        for item in response.data:
            self.assertEqual(item["exam_subject_id"], self.subject.id)


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class DeleteAssignmentsTests(_BaseCorrectionTest):
    def test_delete_assignments(self):
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        result = delete_assignments(self.subject.id, self.admin)
        self.assertTrue(result["deleted_count"] > 0)
        self.assertEqual(
            CorrectionAssignment.objects.filter(
                exam_subject_id=self.subject.id
            ).count(),
            0,
        )

    def test_delete_blocked_when_grades_exist(self):
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        CopyGrade.objects.create(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade=12.00,
            correction_order=CorrectionOrder.FIRST,
        )
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            delete_assignments(self.subject.id, self.admin)


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class UniqueConstraintTests(_BaseCorrectionTest):
    def test_same_corrector_cannot_be_assigned_twice_to_same_copy(self):
        from django.db import IntegrityError

        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        with self.assertRaises(IntegrityError):
            CorrectionAssignment.objects.create(
                anonymous_code="DOCT-2026-AB01",
                exam_subject_id=self.subject.id,
                corrector=self.corrector1,
                order=CorrectionOrder.THIRD,
            )


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class GradeSubmissionServiceTests(_BaseCorrectionTest):
    def setUp(self):
        super().setUp()
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )

    def test_submit_grade_happy_path(self):
        grade = submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade_value=14.50,
        )
        self.assertEqual(grade.grade, 14.50)
        self.assertEqual(grade.correction_order, CorrectionOrder.FIRST)
        self.assertFalse(grade.is_final)

    def test_submit_grade_score_range_validation(self):
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            submit_grade(
                anonymous_code="DOCT-2026-AB01",
                exam_subject_id=self.subject.id,
                corrector=self.corrector1,
                grade_value=25.00,
            )
        self.assertIn("between 0 and 20", str(ctx.exception.detail))

    def test_submit_negative_grade_rejected(self):
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            submit_grade(
                anonymous_code="DOCT-2026-AB01",
                exam_subject_id=self.subject.id,
                corrector=self.corrector1,
                grade_value=-1.00,
            )

    def test_submit_grade_unassigned_corrector_rejected(self):
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            submit_grade(
                anonymous_code="DOCT-2026-AB01",
                exam_subject_id=self.subject.id,
                corrector=self.corrector3,
                grade_value=10.00,
            )
        self.assertIn("not assigned", str(ctx.exception.detail))

    def test_submit_duplicate_grade_rejected(self):
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade_value=12.00,
        )
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            submit_grade(
                anonymous_code="DOCT-2026-AB01",
                exam_subject_id=self.subject.id,
                corrector=self.corrector1,
                grade_value=13.00,
            )
        self.assertIn("already submitted", str(ctx.exception.detail))

    def test_submit_grade_blocked_by_lock(self):
        SubjectGradeLock.objects.create(
            exam_subject_id=self.subject.id, locked_by=self.coordinator
        )
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            submit_grade(
                anonymous_code="DOCT-2026-AB01",
                exam_subject_id=self.subject.id,
                corrector=self.corrector1,
                grade_value=10.00,
            )
        self.assertIn("locked", str(ctx.exception.detail))


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class DiscrepancyDetectionTests(_BaseCorrectionTest):
    def setUp(self):
        super().setUp()
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )

    def test_discrepancy_created_when_difference_exceeds_threshold(self):
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade_value=8.00,
        )
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector2,
            grade_value=14.00,
        )
        discrepancy = GradeDiscrepancy.objects.get(
            anonymous_code="DOCT-2026-AB01", exam_subject_id=self.subject.id
        )
        self.assertEqual(discrepancy.difference, 6.00)
        self.assertFalse(discrepancy.is_resolved)

    def test_no_discrepancy_when_difference_within_threshold(self):
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade_value=12.00,
        )
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector2,
            grade_value=14.00,
        )
        self.assertFalse(
            GradeDiscrepancy.objects.filter(
                anonymous_code="DOCT-2026-AB01", exam_subject_id=self.subject.id
            ).exists()
        )

    def test_no_discrepancy_until_both_grades_entered(self):
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade_value=5.00,
        )
        self.assertFalse(
            GradeDiscrepancy.objects.filter(
                anonymous_code="DOCT-2026-AB01", exam_subject_id=self.subject.id
            ).exists()
        )

    def test_discrepancy_uses_subject_threshold(self):
        high_threshold_subject = ExamSubject.objects.create(
            exam_session=self.session,
            name="Oral Exam",
            coefficient=1.0,
            pass_threshold=10.0,
            max_score=20.0,
            discrepancy_threshold=7.00,
        )
        from apps.anonymization.models import AnonymousCode

        code3 = AnonymousCode.objects.create(
            code="DOCT-2026-EF03",
            candidate_id_encrypted=Fernet(FERNET_KEY.encode()).encrypt(b"3").decode(),
            exam_session_id=self.session.id,
        )

        assign_correctors(
            subject_id=high_threshold_subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )

        submit_grade(
            anonymous_code="DOCT-2026-EF03",
            exam_subject_id=high_threshold_subject.id,
            corrector=self.corrector1,
            grade_value=8.00,
        )
        submit_grade(
            anonymous_code="DOCT-2026-EF03",
            exam_subject_id=high_threshold_subject.id,
            corrector=self.corrector2,
            grade_value=14.00,
        )
        self.assertFalse(
            GradeDiscrepancy.objects.filter(
                anonymous_code="DOCT-2026-EF03",
                exam_subject_id=high_threshold_subject.id,
            ).exists()
        )


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class GradeSubmissionViewTests(_BaseCorrectionTest):
    def setUp(self):
        super().setUp()
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )

    def test_submit_grade_endpoint(self):
        self.client.force_authenticate(user=self.corrector1)
        response = self.client.post(
            "/api/correction/grades/submit/",
            {
                "anonymous_code": "DOCT-2026-AB01",
                "exam_subject_id": self.subject.id,
                "grade": 12.50,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["grade"], "12.50")

    def test_corrector_sees_only_own_grades(self):
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade_value=12.00,
        )
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector2,
            grade_value=14.00,
        )
        self.client.force_authenticate(user=self.corrector1)
        response = self.client.get("/api/correction/grades/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = (
            response.data["results"] if "results" in response.data else response.data
        )
        for item in results:
            self.assertEqual(item["corrector"], self.corrector1.id)

    def test_admin_sees_all_grades(self):
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade_value=12.00,
        )
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector2,
            grade_value=14.00,
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/correction/grades/")
        results = (
            response.data["results"] if "results" in response.data else response.data
        )
        self.assertEqual(len(results), 2)


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class ThirdCorrectorTests(_BaseCorrectionTest):
    def setUp(self):
        super().setUp()
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade_value=8.00,
        )
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector2,
            grade_value=14.00,
        )
        self.discrepancy = GradeDiscrepancy.objects.get(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
        )

    def test_assign_third_corrector(self):
        assignment = assign_third_corrector(
            discrepancy_id=self.discrepancy.id,
            third_corrector_id=self.corrector3.id,
            user=self.coordinator,
        )
        self.assertEqual(assignment.order, CorrectionOrder.THIRD)
        self.assertEqual(assignment.corrector, self.corrector3)

    def test_assign_third_corrector_non_corrector_rejected(self):
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            assign_third_corrector(
                discrepancy_id=self.discrepancy.id,
                third_corrector_id=self.supervisor.id,
                user=self.coordinator,
            )

    def test_assign_third_to_resolved_discrepancy_rejected(self):
        self.discrepancy.is_resolved = True
        self.discrepancy.save()
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            assign_third_corrector(
                discrepancy_id=self.discrepancy.id,
                third_corrector_id=self.corrector3.id,
                user=self.coordinator,
            )
        self.assertIn("already resolved", str(ctx.exception.detail))

    def test_submit_third_grade_resolves_discrepancy(self):
        assign_third_corrector(
            discrepancy_id=self.discrepancy.id,
            third_corrector_id=self.corrector3.id,
            user=self.coordinator,
        )
        grade = submit_third_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector3,
            grade_value=11.00,
        )
        self.assertEqual(grade.correction_order, CorrectionOrder.THIRD)
        self.discrepancy.refresh_from_db()
        self.assertTrue(self.discrepancy.is_resolved)

    def test_third_grade_blocked_if_not_assigned(self):
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            submit_third_grade(
                anonymous_code="DOCT-2026-AB01",
                exam_subject_id=self.subject.id,
                corrector=self.corrector3,
                grade_value=11.00,
            )
        self.assertIn("not assigned as the third", str(ctx.exception.detail))

    def test_assign_third_corrector_endpoint(self):
        self.client.force_authenticate(user=self.coordinator)
        response = self.client.post(
            f"/api/correction/discrepancies/{self.discrepancy.id}/assign-third-corrector/",
            {"third_corrector_id": self.corrector3.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class FinalGradeComputationTests(_BaseCorrectionTest):
    def _seed_two_grades(self, g1, g2):
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade_value=g1,
        )
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector2,
            grade_value=g2,
        )
        submit_grade(
            anonymous_code="DOCT-2026-CD02",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade_value=g1,
        )
        submit_grade(
            anonymous_code="DOCT-2026-CD02",
            exam_subject_id=self.subject.id,
            corrector=self.corrector2,
            grade_value=g2,
        )

    def test_average_rule_no_discrepancy(self):
        self.subject.final_grade_rule = FinalGradeRule.AVERAGE
        self.subject.save()
        self._seed_two_grades(12.00, 14.00)
        result = compute_final_grades(subject_id=self.subject.id, user=self.coordinator)
        self.assertEqual(result["final_grade_rule"], "AVERAGE")
        for r in result["results"]:
            self.assertEqual(r["final_grade"], "13.00")

    def test_median_rule_no_discrepancy(self):
        self.subject.final_grade_rule = FinalGradeRule.MEDIAN
        self.subject.save()
        self._seed_two_grades(12.00, 14.00)
        result = compute_final_grades(subject_id=self.subject.id, user=self.coordinator)
        for r in result["results"]:
            self.assertEqual(r["final_grade"], "13.00")

    def test_third_corrector_rule_with_third_grade(self):
        self.subject.final_grade_rule = FinalGradeRule.THIRD_CORRECTOR
        self.subject.save()
        self._seed_two_grades(8.00, 14.00)

        discrepancy = GradeDiscrepancy.objects.get(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
        )
        assign_third_corrector(
            discrepancy_id=discrepancy.id,
            third_corrector_id=self.corrector3.id,
            user=self.coordinator,
        )
        submit_third_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector3,
            grade_value=11.00,
        )

        discrepancy2 = GradeDiscrepancy.objects.get(
            anonymous_code="DOCT-2026-CD02",
            exam_subject_id=self.subject.id,
        )
        assign_third_corrector(
            discrepancy_id=discrepancy2.id,
            third_corrector_id=self.corrector3.id,
            user=self.coordinator,
        )
        submit_third_grade(
            anonymous_code="DOCT-2026-CD02",
            exam_subject_id=self.subject.id,
            corrector=self.corrector3,
            grade_value=10.00,
        )

        result = compute_final_grades(subject_id=self.subject.id, user=self.coordinator)
        ab01_result = next(
            r for r in result["results"] if r["anonymous_code"] == "DOCT-2026-AB01"
        )
        self.assertEqual(ab01_result["final_grade"], "11.00")
        cd02_result = next(
            r for r in result["results"] if r["anonymous_code"] == "DOCT-2026-CD02"
        )
        self.assertEqual(cd02_result["final_grade"], "10.00")

    def test_compute_fails_if_missing_grades(self):
        self.subject.final_grade_rule = FinalGradeRule.AVERAGE
        self.subject.save()
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade_value=12.00,
        )
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            compute_final_grades(subject_id=self.subject.id, user=self.coordinator)
        self.assertIn("does not have both initial grades", str(ctx.exception.detail))

    def test_compute_fails_if_unresolved_discrepancy_with_third_rule(self):
        self.subject.final_grade_rule = FinalGradeRule.THIRD_CORRECTOR
        self.subject.save()
        self._seed_two_grades(8.00, 14.00)
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            compute_final_grades(subject_id=self.subject.id, user=self.coordinator)
        self.assertIn("unresolved discrepancy", str(ctx.exception.detail))

    def test_compute_final_grades_endpoint(self):
        self.subject.final_grade_rule = FinalGradeRule.AVERAGE
        self.subject.save()
        self._seed_two_grades(12.00, 14.00)
        self.client.force_authenticate(user=self.coordinator)
        response = self.client.post(
            "/api/correction/compute-final-grades/",
            {"subject_id": self.subject.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["final_grade_rule"], "AVERAGE")

    def test_compute_marks_is_final(self):
        self.subject.final_grade_rule = FinalGradeRule.AVERAGE
        self.subject.save()
        self._seed_two_grades(12.00, 14.00)
        compute_final_grades(subject_id=self.subject.id, user=self.coordinator)
        final_count = CopyGrade.objects.filter(
            exam_subject_id=self.subject.id,
            is_final=True,
        ).count()
        self.assertEqual(final_count, 4)


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class GradeLockTests(_BaseCorrectionTest):
    def _seed_complete_correction(self):
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade_value=12.00,
        )
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector2,
            grade_value=14.00,
        )
        submit_grade(
            anonymous_code="DOCT-2026-CD02",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade_value=10.00,
        )
        submit_grade(
            anonymous_code="DOCT-2026-CD02",
            exam_subject_id=self.subject.id,
            corrector=self.corrector2,
            grade_value=11.00,
        )
        compute_final_grades(subject_id=self.subject.id, user=self.coordinator)

    def test_lock_subject_grades(self):
        self._seed_complete_correction()
        lock = lock_subject_grades(subject_id=self.subject.id, user=self.coordinator)
        self.assertEqual(lock.exam_subject_id, self.subject.id)
        self.assertEqual(lock.locked_by, self.coordinator)
        self.subject.refresh_from_db()
        self.assertEqual(self.subject.status, ExamSubjectStatus.LOCKED)

    def test_cannot_submit_grade_after_lock(self):
        self._seed_complete_correction()
        lock_subject_grades(subject_id=self.subject.id, user=self.coordinator)
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            submit_grade(
                anonymous_code="DOCT-2026-AB01",
                exam_subject_id=self.subject.id,
                corrector=self.corrector1,
                grade_value=15.00,
            )
        self.assertIn("locked", str(ctx.exception.detail))

    def test_double_lock_prevented(self):
        self._seed_complete_correction()
        lock_subject_grades(subject_id=self.subject.id, user=self.coordinator)
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            lock_subject_grades(subject_id=self.subject.id, user=self.coordinator)
        self.assertIn("already locked", str(ctx.exception.detail))

    def test_lock_requires_final_grades(self):
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade_value=12.00,
        )
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector2,
            grade_value=14.00,
        )
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            lock_subject_grades(subject_id=self.subject.id, user=self.coordinator)
        self.assertIn("final grades computed", str(ctx.exception.detail))

    def test_lock_endpoint(self):
        self._seed_complete_correction()
        self.client.force_authenticate(user=self.coordinator)
        response = self.client.post(
            "/api/correction/locks/lock-subject/",
            {"subject_id": self.subject.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            SubjectGradeLock.objects.filter(exam_subject_id=self.subject.id).exists()
        )


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class CorrectionPVTests(_BaseCorrectionTest):
    def _seed_and_lock(self):
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade_value=12.00,
        )
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector2,
            grade_value=14.00,
        )
        submit_grade(
            anonymous_code="DOCT-2026-CD02",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade_value=10.00,
        )
        submit_grade(
            anonymous_code="DOCT-2026-CD02",
            exam_subject_id=self.subject.id,
            corrector=self.corrector2,
            grade_value=11.00,
        )
        compute_final_grades(subject_id=self.subject.id, user=self.coordinator)
        lock_subject_grades(subject_id=self.subject.id, user=self.coordinator)

    def test_generate_correction_pv(self):
        self._seed_and_lock()
        from apps.pv.models import PVDocument, PVType

        pv = generate_correction_pv(subject_id=self.subject.id, user=self.coordinator)
        self.assertEqual(pv.pv_type, PVType.CORRECTION)
        self.assertTrue(pv.file)

    def test_generate_pv_requires_lock(self):
        assign_correctors(
            subject_id=self.subject.id,
            corrector_ids=[self.corrector1.id, self.corrector2.id],
            user=self.coordinator,
        )
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector1,
            grade_value=12.00,
        )
        submit_grade(
            anonymous_code="DOCT-2026-AB01",
            exam_subject_id=self.subject.id,
            corrector=self.corrector2,
            grade_value=14.00,
        )
        compute_final_grades(subject_id=self.subject.id, user=self.coordinator)
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError) as ctx:
            generate_correction_pv(subject_id=self.subject.id, user=self.coordinator)
        self.assertIn("not locked", str(ctx.exception.detail))

    def test_generate_pv_endpoint(self):
        self._seed_and_lock()
        self.client.force_authenticate(user=self.coordinator)
        response = self.client.post(
            "/api/correction/generate-pv/",
            {"subject_id": self.subject.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["pv_type"], "CORRECTION")

    def test_pv_content_includes_grades(self):
        self._seed_and_lock()
        pv = generate_correction_pv(subject_id=self.subject.id, user=self.coordinator)
        content = pv.file.read().decode("utf-8")
        self.assertIn("DOCT-2026-AB01", content)
        self.assertIn("DOCT-2026-CD02", content)
        self.assertIn("PV DE CORRECTION", content)
