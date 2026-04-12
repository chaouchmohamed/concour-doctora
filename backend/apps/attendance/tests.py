from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import RoleChoices
from apps.candidates.models import Candidate, CandidateStatus
from apps.examinations.models import ExamAllocation, ExamRoom, ExamSession, ExamSessionStatus, ExamSubject, SubjectSchedule

from .models import AttendanceRecord, AttendanceStatus, AttendanceSubmission

User = get_user_model()


class AttendanceFinalizationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.supervisor = User.objects.create_user(email="supervisor@test.local", role=RoleChoices.SUPERVISOR, is_active=True)
        self.client.force_authenticate(user=self.supervisor)

        self.session = ExamSession.objects.create(name="Automne 2026", year=2026, status=ExamSessionStatus.ACTIVE)
        self.subject = ExamSubject.objects.create(exam_session=self.session, name="Informatique", coefficient=1.0, pass_threshold=10.0)
        self.room = ExamRoom.objects.create(exam_session=self.session, name="Salle A", capacity=10)
        self.schedule = SubjectSchedule.objects.create(
            subject=self.subject, room=self.room, exam_date="2026-10-10", start_time="09:00:00", duration_minutes=120
        )

        self.c1 = Candidate.objects.create(national_id="N-01", first_name="A", last_name="A", email="a@t.lo", phone="01", application_number="A-01", status=CandidateStatus.REGISTERED)
        self.c2 = Candidate.objects.create(national_id="N-02", first_name="B", last_name="B", email="b@t.lo", phone="02", application_number="A-02", status=CandidateStatus.REGISTERED)
        self.c3 = Candidate.objects.create(national_id="N-03", first_name="C", last_name="C", email="c@t.lo", phone="03", application_number="A-03", status=CandidateStatus.REGISTERED)

        # Allocate only c1 and c2 to Salle A.
        ExamAllocation.objects.create(candidate=self.c1, subject_schedule=self.schedule, seat_number=1)
        ExamAllocation.objects.create(candidate=self.c2, subject_schedule=self.schedule, seat_number=2)

        self.submission = AttendanceSubmission.objects.create(exam_schedule=self.schedule, submitted_by=self.supervisor)
        self.url = f"/api/attendance/submissions/{self.submission.id}/finalize/"

    def test_finalize_fails_when_candidates_missing(self):
        # Only c1 is marked. c2 is missing.
        AttendanceRecord.objects.create(submission=self.submission, candidate=self.c1, status=AttendanceStatus.PRESENT)

        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Cannot finalize. Only 1 out of 2 expected candidates have been marked.", response.data["detail"])
        
        self.submission.refresh_from_db()
        self.assertFalse(self.submission.is_finalized)

    def test_finalize_succeeds_and_eliminates_absent(self):
        # Both marked. c1 present, c2 absent.
        AttendanceRecord.objects.create(submission=self.submission, candidate=self.c1, status=AttendanceStatus.PRESENT)
        AttendanceRecord.objects.create(submission=self.submission, candidate=self.c2, status=AttendanceStatus.ABSENT)

        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.submission.refresh_from_db()
        self.assertTrue(self.submission.is_finalized)

        self.c1.refresh_from_db()
        self.c2.refresh_from_db()
        self.assertEqual(self.c1.status, CandidateStatus.REGISTERED)
        self.assertEqual(self.c2.status, CandidateStatus.ELIMINATED)

    def test_record_mutations_blocked_after_finalize(self):
        AttendanceRecord.objects.create(submission=self.submission, candidate=self.c1, status=AttendanceStatus.PRESENT)
        r2 = AttendanceRecord.objects.create(submission=self.submission, candidate=self.c2, status=AttendanceStatus.PRESENT)
        self.client.post(self.url)  # Finalize

        # Try to update r2
        update_url = f"/api/attendance/records/{r2.id}/"
        response = self.client.patch(update_url, {"status": AttendanceStatus.ABSENT})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already finalized", response.data["detail"])

        # Try to create new
        create_url = "/api/attendance/records/"
        response = self.client.post(create_url, {"submission": self.submission.id, "candidate": self.c3.id, "status": AttendanceStatus.PRESENT})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already finalized", response.data["detail"])

    def test_cannot_finalize_twice(self):
        AttendanceRecord.objects.create(submission=self.submission, candidate=self.c1, status=AttendanceStatus.PRESENT)
        AttendanceRecord.objects.create(submission=self.submission, candidate=self.c2, status=AttendanceStatus.PRESENT)
        
        self.client.post(self.url)
        response2 = self.client.post(self.url)
        
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already finalized", response2.data["detail"])
