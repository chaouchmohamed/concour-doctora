from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import RoleChoices
from apps.candidates.models import Candidate, CandidateStatus
from apps.pv.models import PVType

from .models import (
    ExamAllocation,
    ExamRoom,
    ExamSession,
    ExamSessionStatus,
    ExamSubject,
    SubjectSchedule,
)

User = get_user_model()


class _BaseExaminationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@test.local", role=RoleChoices.ADMIN, is_active=True
        )
        self.cfd_head = User.objects.create_user(
            email="cfd@test.local", role=RoleChoices.CFD_HEAD, is_active=True
        )
        self.supervisor = User.objects.create_user(
            email="sup@test.local", role=RoleChoices.SUPERVISOR, is_active=True
        )
        self.coordinator = User.objects.create_user(
            email="coord@test.local", role=RoleChoices.COORDINATOR, is_active=True
        )
        self.corrector = User.objects.create_user(
            email="corr@test.local", role=RoleChoices.CORRECTOR, is_active=True
        )
        self.client.force_authenticate(user=self.admin)

        self.session = ExamSession.objects.create(
            name="Automne 2026", year=2026, status=ExamSessionStatus.ACTIVE
        )
        self.subject1 = ExamSubject.objects.create(
            exam_session=self.session,
            name="Informatique",
            coefficient=1.0,
            pass_threshold=10.0,
            max_score=20.0,
        )
        self.subject2 = ExamSubject.objects.create(
            exam_session=self.session,
            name="Mathematiques",
            coefficient=2.0,
            pass_threshold=10.0,
            max_score=20.0,
        )
        self.room1 = ExamRoom.objects.create(
            exam_session=self.session, name="Salle A", capacity=10
        )
        self.room2 = ExamRoom.objects.create(
            exam_session=self.session, name="Salle B", capacity=10
        )
        self.schedule1 = SubjectSchedule.objects.create(
            subject=self.subject1,
            room=self.room1,
            exam_date="2026-10-10",
            start_time="09:00:00",
            duration_minutes=120,
        )
        self.schedule2 = SubjectSchedule.objects.create(
            subject=self.subject1,
            room=self.room2,
            exam_date="2026-10-10",
            start_time="09:00:00",
            duration_minutes=120,
        )

        self.candidates = []
        for i in range(1, 13):
            c = Candidate.objects.create(
                national_id=f"N-{i:02d}",
                first_name=f"Fn{i}",
                last_name=f"Ln{i}",
                email=f"c{i}@t.lo",
                phone=f"0{i}",
                application_number=f"A-{i:02d}",
                status=CandidateStatus.REGISTERED,
            )
            self.candidates.append(c)


class SubjectValidationTests(_BaseExaminationTest):
    def test_create_subject_with_invalid_coefficient(self):
        response = self.client.post(
            "/api/examinations/subjects/",
            {
                "exam_session": self.session.id,
                "name": "Bad",
                "coefficient": 0,
                "pass_threshold": 10.0,
                "max_score": 20.0,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Coefficient", str(response.data["coefficient"]))

    def test_create_subject_with_threshold_above_max_score(self):
        response = self.client.post(
            "/api/examinations/subjects/",
            {
                "exam_session": self.session.id,
                "name": "Bad",
                "coefficient": 1.0,
                "pass_threshold": 25.0,
                "max_score": 20.0,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Pass threshold", str(response.data["pass_threshold"]))

    def test_create_subject_with_negative_discrepancy(self):
        response = self.client.post(
            "/api/examinations/subjects/",
            {
                "exam_session": self.session.id,
                "name": "Bad",
                "coefficient": 1.0,
                "pass_threshold": 10.0,
                "max_score": 20.0,
                "discrepancy_threshold": -1.0,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Discrepancy", str(response.data["discrepancy_threshold"]))


class AutoAllocationTests(_BaseExaminationTest):
    def test_auto_allocate_distributes_candidates_across_rooms(self):
        url = f"/api/examinations/schedules/{self.schedule1.id}/auto_allocate/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["candidates_allocated"], 12)
        self.assertEqual(response.data["rooms_used"], 2)

        allocations = ExamAllocation.objects.filter(
            subject_schedule__subject=self.subject1
        )
        self.assertEqual(allocations.count(), 12)

        room1_count = ExamAllocation.objects.filter(
            subject_schedule=self.schedule1
        ).count()
        room2_count = ExamAllocation.objects.filter(
            subject_schedule=self.schedule2
        ).count()
        self.assertEqual(room1_count + room2_count, 12)
        self.assertTrue(room1_count > 0)
        self.assertTrue(room2_count > 0)

    def test_auto_allocate_reshuffles_on_rerun(self):
        url = f"/api/examinations/schedules/{self.schedule1.id}/auto_allocate/"
        self.client.post(url)

        total = ExamAllocation.objects.filter(
            subject_schedule__subject=self.subject1
        ).count()
        self.assertEqual(total, 12)

        self.client.post(url)
        total_after = ExamAllocation.objects.filter(
            subject_schedule__subject=self.subject1
        ).count()
        self.assertEqual(total_after, 12)


class CallListTests(_BaseExaminationTest):
    def test_call_list_per_room_returns_candidates(self):
        for i, c in enumerate(self.candidates[:6], start=1):
            ExamAllocation.objects.create(
                candidate=c, subject_schedule=self.schedule1, seat_number=i
            )

        url = f"/api/examinations/schedules/{self.schedule1.id}/call_list/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 6)
        self.assertIn("application_number", response.data[0])
        self.assertIn("full_name", response.data[0])
        self.assertEqual(response.data[0]["room"], "Salle A")

    def test_call_list_consolidated_by_subject(self):
        for i, c in enumerate(self.candidates[:6], start=1):
            ExamAllocation.objects.create(
                candidate=c, subject_schedule=self.schedule1, seat_number=i
            )
        for i, c in enumerate(self.candidates[6:9], start=1):
            ExamAllocation.objects.create(
                candidate=c, subject_schedule=self.schedule2, seat_number=i
            )

        url = f"/api/examinations/subjects/{self.subject1.id}/call_list/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)
        self.assertIn("candidates", response.data[0])

    def test_supervisor_can_read_call_list(self):
        self.client.force_authenticate(user=self.supervisor)
        url = f"/api/examinations/schedules/{self.schedule1.id}/call_list/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_corrector_cannot_read_call_list(self):
        self.client.force_authenticate(user=self.corrector)
        url = f"/api/examinations/schedules/{self.schedule1.id}/call_list/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class LotteryTests(_BaseExaminationTest):
    def test_cfd_head_records_lottery(self):
        self.client.force_authenticate(user=self.cfd_head)
        url = f"/api/examinations/sessions/{self.session.id}/lottery/"
        response = self.client.post(url, {"selected_subject_id": self.subject1.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("pv_document_id", response.data)
        self.assertEqual(response.data["pv_type"], PVType.SUBJECT_LOTTERY)

        self.session.refresh_from_db()
        self.assertEqual(self.session.lottery_subject_id, self.subject1.id)

    def test_non_cfd_head_cannot_record_lottery(self):
        self.client.force_authenticate(user=self.supervisor)
        url = f"/api/examinations/sessions/{self.session.id}/lottery/"
        response = self.client.post(url, {"selected_subject_id": self.subject1.id})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_lottery_rejects_subject_from_other_session(self):
        other_session = ExamSession.objects.create(
            name="Autre 2025", year=2025, status=ExamSessionStatus.ACTIVE
        )
        other_subject = ExamSubject.objects.create(
            exam_session=other_session,
            name="Autre",
            coefficient=1.0,
            pass_threshold=10.0,
            max_score=20.0,
        )
        self.client.force_authenticate(user=self.cfd_head)
        url = f"/api/examinations/sessions/{self.session.id}/lottery/"
        response = self.client.post(url, {"selected_subject_id": other_subject.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SubjectCreationPVTests(_BaseExaminationTest):
    def test_cfd_head_records_subjects_and_generates_pv(self):
        self.client.force_authenticate(user=self.cfd_head)
        url = f"/api/examinations/sessions/{self.session.id}/record_subjects/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("pv_document_id", response.data)
        self.assertEqual(response.data["pv_type"], PVType.SUBJECT_CREATION)

    def test_record_subjects_rejected_if_no_subjects(self):
        empty_session = ExamSession.objects.create(
            name="Empty 2026", year=2026, status=ExamSessionStatus.ACTIVE
        )
        self.client.force_authenticate(user=self.cfd_head)
        url = f"/api/examinations/sessions/{empty_session.id}/record_subjects/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
