import csv
import io

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import RoleChoices
from apps.candidates.models import Candidate, CandidateStatus
from apps.examinations.models import ExamAllocation, ExamRoom, ExamSession, ExamSessionStatus, ExamSubject, SubjectSchedule
from apps.pv.models import PVDocument, PVType

from .models import AttendanceRecord, AttendanceStatus, AttendanceSubmission

User = get_user_model()


class _BaseAttendanceTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.supervisor = User.objects.create_user(
            email="supervisor@test.local", role=RoleChoices.SUPERVISOR, is_active=True
        )
        self.admin = User.objects.create_user(
            email="admin@test.local", role=RoleChoices.ADMIN, is_active=True
        )
        self.client.force_authenticate(user=self.supervisor)

        self.session = ExamSession.objects.create(
            name="Automne 2026", year=2026, status=ExamSessionStatus.ACTIVE
        )
        self.subject = ExamSubject.objects.create(
            exam_session=self.session, name="Informatique",
            coefficient=1.0, pass_threshold=10.0,
        )
        self.room = ExamRoom.objects.create(
            exam_session=self.session, name="Salle A", capacity=10
        )
        self.schedule = SubjectSchedule.objects.create(
            subject=self.subject, room=self.room,
            exam_date="2026-10-10", start_time="09:00:00", duration_minutes=120,
        )

        self.c1 = Candidate.objects.create(
            national_id="N-01", first_name="A", last_name="A",
            email="a@t.lo", phone="01", application_number="A-01",
            status=CandidateStatus.REGISTERED,
        )
        self.c2 = Candidate.objects.create(
            national_id="N-02", first_name="B", last_name="B",
            email="b@t.lo", phone="02", application_number="A-02",
            status=CandidateStatus.REGISTERED,
        )
        self.c3 = Candidate.objects.create(
            national_id="N-03", first_name="C", last_name="C",
            email="c@t.lo", phone="03", application_number="A-03",
            status=CandidateStatus.REGISTERED,
        )

        ExamAllocation.objects.create(candidate=self.c1, subject_schedule=self.schedule, seat_number=1)
        ExamAllocation.objects.create(candidate=self.c2, subject_schedule=self.schedule, seat_number=2)

        self.submission = AttendanceSubmission.objects.create(
            exam_schedule=self.schedule, submitted_by=self.supervisor
        )
        self.finalize_url = f"/api/attendance/submissions/{self.submission.id}/finalize/"


class AttendanceFinalizationTests(_BaseAttendanceTest):
    def test_finalize_fails_when_candidates_missing(self):
        AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c1, status=AttendanceStatus.PRESENT
        )
        response = self.client.post(self.finalize_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(
            "Cannot finalize. Only 1 out of 2 expected candidates have been marked.",
            response.data["detail"],
        )
        self.submission.refresh_from_db()
        self.assertFalse(self.submission.is_finalized)

    def test_finalize_succeeds_and_eliminates_absent(self):
        AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c1, status=AttendanceStatus.PRESENT
        )
        AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c2, status=AttendanceStatus.ABSENT
        )
        response = self.client.post(self.finalize_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.submission.refresh_from_db()
        self.assertTrue(self.submission.is_finalized)

        self.c1.refresh_from_db()
        self.c2.refresh_from_db()
        self.assertEqual(self.c1.status, CandidateStatus.REGISTERED)
        self.assertEqual(self.c2.status, CandidateStatus.ELIMINATED)

    def test_record_mutations_blocked_after_finalize(self):
        AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c1, status=AttendanceStatus.PRESENT
        )
        r2 = AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c2, status=AttendanceStatus.PRESENT
        )
        self.client.post(self.finalize_url)

        update_url = f"/api/attendance/records/{r2.id}/"
        response = self.client.patch(update_url, {"status": AttendanceStatus.ABSENT})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already finalized", response.data["detail"])

        create_url = "/api/attendance/records/"
        response = self.client.post(
            create_url,
            {"submission": self.submission.id, "candidate": self.c3.id, "status": AttendanceStatus.PRESENT},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already finalized", response.data["detail"])

    def test_cannot_finalize_twice(self):
        AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c1, status=AttendanceStatus.PRESENT
        )
        AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c2, status=AttendanceStatus.PRESENT
        )
        self.client.post(self.finalize_url)
        response2 = self.client.post(self.finalize_url)
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already finalized", response2.data["detail"])

    def test_finalize_generates_pv(self):
        AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c1, status=AttendanceStatus.PRESENT
        )
        AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c2, status=AttendanceStatus.ABSENT
        )
        response = self.client.post(self.finalize_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("pv_document_id", response.data)
        self.assertIn("pv_document_identifier", response.data)

        pv = PVDocument.objects.get(id=response.data["pv_document_id"])
        self.assertEqual(pv.pv_type, PVType.ATTENDANCE)
        self.assertEqual(pv.exam_session_id, self.session.id)
        self.assertIsNotNone(pv.file)


class AttendanceUndoTests(_BaseAttendanceTest):
    def test_undo_removes_record_before_finalize(self):
        r1 = AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c1, status=AttendanceStatus.PRESENT,
            marked_by=self.supervisor,
        )
        url = f"/api/attendance/records/{r1.id}/undo/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(AttendanceRecord.objects.filter(id=r1.id).exists())
        self.assertEqual(self.submission.records.count(), 0)

    def test_undo_blocked_after_finalize(self):
        r1 = AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c1, status=AttendanceStatus.PRESENT,
        )
        r2 = AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c2, status=AttendanceStatus.PRESENT,
        )
        self.client.post(self.finalize_url)

        url = f"/api/attendance/records/{r1.id}/undo/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already finalized", response.data["detail"])


class AttendanceToggleTests(_BaseAttendanceTest):
    def test_toggle_switches_present_to_absent(self):
        r1 = AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c1, status=AttendanceStatus.PRESENT,
            marked_by=self.supervisor,
        )
        url = f"/api/attendance/records/{r1.id}/toggle/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], AttendanceStatus.ABSENT)

    def test_toggle_switches_absent_to_present(self):
        r1 = AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c1, status=AttendanceStatus.ABSENT,
            marked_by=self.supervisor,
        )
        url = f"/api/attendance/records/{r1.id}/toggle/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], AttendanceStatus.PRESENT)

    def test_toggle_blocked_after_finalize(self):
        r1 = AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c1, status=AttendanceStatus.PRESENT,
        )
        r2 = AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c2, status=AttendanceStatus.PRESENT,
        )
        self.client.post(self.finalize_url)

        url = f"/api/attendance/records/{r1.id}/toggle/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already finalized", response.data["detail"])


class AttendanceCounterTests(_BaseAttendanceTest):
    def test_counter_before_any_marking(self):
        url = f"/api/attendance/submissions/{self.submission.id}/counter/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_expected"], 2)
        self.assertEqual(response.data["total_marked"], 0)
        self.assertEqual(response.data["total_unmarked"], 2)
        self.assertEqual(response.data["present_count"], 0)
        self.assertEqual(response.data["absent_count"], 0)
        self.assertFalse(response.data["is_finalized"])

    def test_counter_partial_marking(self):
        AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c1, status=AttendanceStatus.PRESENT,
            marked_by=self.supervisor,
        )
        url = f"/api/attendance/submissions/{self.submission.id}/counter/"
        response = self.client.get(url)
        self.assertEqual(response.data["total_marked"], 1)
        self.assertEqual(response.data["total_unmarked"], 1)
        self.assertEqual(response.data["present_count"], 1)
        self.assertEqual(response.data["absent_count"], 0)

    def test_counter_all_marked(self):
        AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c1, status=AttendanceStatus.PRESENT,
            marked_by=self.supervisor,
        )
        AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c2, status=AttendanceStatus.ABSENT,
            marked_by=self.supervisor,
        )
        url = f"/api/attendance/submissions/{self.submission.id}/counter/"
        response = self.client.get(url)
        self.assertEqual(response.data["total_marked"], 2)
        self.assertEqual(response.data["total_unmarked"], 0)
        self.assertEqual(response.data["present_count"], 1)
        self.assertEqual(response.data["absent_count"], 1)


class AttendanceCSVImportTests(_BaseAttendanceTest):
    def _make_csv(self, rows: list[dict]) -> io.BytesIO:
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=["application_number", "status"])
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
        buf = io.BytesIO(output.getvalue().encode("utf-8"))
        buf.name = "attendance.csv"
        buf.seek(0)
        return buf

    def test_csv_import_creates_records(self):
        csv_file = self._make_csv([
            {"application_number": "A-01", "status": "PRESENT"},
            {"application_number": "A-02", "status": "ABSENT"},
        ])
        url = f"/api/attendance/submissions/{self.submission.id}/import_csv/"
        response = self.client.post(url, {"file": csv_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["created"], 2)
        self.assertEqual(response.data["skipped_duplicates"], 0)
        self.assertEqual(len(response.data["errors"]), 0)

        self.assertEqual(self.submission.records.count(), 2)
        r1 = self.submission.records.get(candidate=self.c1)
        self.assertEqual(r1.status, AttendanceStatus.PRESENT)
        r2 = self.submission.records.get(candidate=self.c2)
        self.assertEqual(r2.status, AttendanceStatus.ABSENT)

    def test_csv_import_skips_existing(self):
        AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c1, status=AttendanceStatus.PRESENT,
            marked_by=self.supervisor,
        )
        csv_file = self._make_csv([
            {"application_number": "A-01", "status": "ABSENT"},
            {"application_number": "A-02", "status": "PRESENT"},
        ])
        url = f"/api/attendance/submissions/{self.submission.id}/import_csv/"
        response = self.client.post(url, {"file": csv_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["created"], 1)
        self.assertEqual(response.data["skipped_duplicates"], 1)

        r1 = self.submission.records.get(candidate=self.c1)
        self.assertEqual(r1.status, AttendanceStatus.PRESENT)

    def test_csv_import_rejects_invalid_status(self):
        csv_file = self._make_csv([
            {"application_number": "A-01", "status": "LATE"},
        ])
        url = f"/api/attendance/submissions/{self.submission.id}/import_csv/"
        response = self.client.post(url, {"file": csv_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["created"], 0)
        self.assertEqual(len(response.data["errors"]), 1)
        self.assertIn("Invalid status", response.data["errors"][0]["message"])

    def test_csv_import_rejects_unknown_application_number(self):
        csv_file = self._make_csv([
            {"application_number": "X-99", "status": "PRESENT"},
        ])
        url = f"/api/attendance/submissions/{self.submission.id}/import_csv/"
        response = self.client.post(url, {"file": csv_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["created"], 0)
        self.assertEqual(len(response.data["errors"]), 1)
        self.assertIn("No allocation found", response.data["errors"][0]["message"])

    def test_csv_import_blocked_after_finalize(self):
        AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c1, status=AttendanceStatus.PRESENT,
        )
        AttendanceRecord.objects.create(
            submission=self.submission, candidate=self.c2, status=AttendanceStatus.PRESENT,
        )
        self.client.post(self.finalize_url)

        csv_file = self._make_csv([
            {"application_number": "A-01", "status": "ABSENT"},
        ])
        url = f"/api/attendance/submissions/{self.submission.id}/import_csv/"
        response = self.client.post(url, {"file": csv_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("finalized", response.data["detail"])

    def test_csv_import_empty_file_rejected(self):
        buf = io.BytesIO(b"application_number,status\n")
        buf.name = "empty.csv"
        buf.seek(0)
        url = f"/api/attendance/submissions/{self.submission.id}/import_csv/"
        response = self.client.post(url, {"file": buf}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("empty", response.data["detail"])

    def test_csv_import_no_file_rejected(self):
        url = f"/api/attendance/submissions/{self.submission.id}/import_csv/"
        response = self.client.post(url, {}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("No file", response.data["detail"])
