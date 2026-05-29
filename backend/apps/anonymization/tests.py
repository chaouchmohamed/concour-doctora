import io

from cryptography.fernet import Fernet
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import RoleChoices
from apps.candidates.models import Candidate, CandidateStatus
from apps.examinations.models import (
    ExamAllocation,
    ExamRoom,
    ExamSession,
    ExamSessionStatus,
    ExamSubject,
    SubjectSchedule,
)
from apps.pv.models import PVDocument, PVType

from .models import AnonymousCode, ExamCopy
from .services import (
    decrypt_candidate_id,
    encrypt_candidate_id,
    generate_anonymous_code,
    upload_and_code_copy,
)

User = get_user_model()

FERNET_KEY = Fernet.generate_key().decode()


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class EncryptionTests(TestCase):
    def test_encrypt_decrypt_roundtrip(self):
        original = 42
        encrypted = encrypt_candidate_id(original)
        self.assertNotEqual(encrypted, str(original))
        decrypted = decrypt_candidate_id(encrypted)
        self.assertEqual(decrypted, original)

    def test_different_encryptions_are_different(self):
        e1 = encrypt_candidate_id(1)
        e2 = encrypt_candidate_id(1)
        self.assertNotEqual(e1, e2)


class AnonymousCodeFormatTests(TestCase):
    databases = "__all__"

    def test_code_format(self):
        code = generate_anonymous_code(year=2026, session_id=99)
        self.assertTrue(code.startswith("DOCT-2026-"))
        suffix = code.split("-")[-1]
        self.assertEqual(len(suffix), 4)
        self.assertTrue(suffix.isalnum())

    def test_code_uniqueness(self):
        AnonymousCode.objects.create(
            code="DOCT-2026-A1B2",
            candidate_id_encrypted="fake",
            exam_session_id=1,
        )
        codes = set()
        for _ in range(50):
            code = generate_anonymous_code(year=2026, session_id=1)
            codes.add(code)
        for c in codes:
            self.assertNotEqual(c, "DOCT-2026-A1B2")


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class UploadAndCodeTests(TestCase):
    databases = "__all__"

    def setUp(self):
        self.client = APIClient()
        self.anon_commission = User.objects.create_user(
            email="anon@test.local",
            role=RoleChoices.ANONYMITY_COMMISSION,
            is_active=True,
        )
        self.admin = User.objects.create_user(
            email="admin@test.local", role=RoleChoices.ADMIN, is_active=True
        )
        self.corrector = User.objects.create_user(
            email="corrector@test.local", role=RoleChoices.CORRECTOR, is_active=True
        )
        self.client.force_authenticate(user=self.anon_commission)

        self.session = ExamSession.objects.create(
            name="Automne 2026", year=2026, status=ExamSessionStatus.ACTIVE
        )
        self.subject = ExamSubject.objects.create(
            exam_session=self.session,
            name="Informatique",
            coefficient=1.0,
            pass_threshold=10.0,
        )
        self.room = ExamRoom.objects.create(
            exam_session=self.session, name="Salle A", capacity=10
        )
        self.schedule = SubjectSchedule.objects.create(
            subject=self.subject,
            room=self.room,
            exam_date="2026-10-10",
            start_time="09:00:00",
            duration_minutes=120,
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

        ExamAllocation.objects.create(
            candidate=self.c1, subject_schedule=self.schedule, seat_number=1
        )
        ExamAllocation.objects.create(
            candidate=self.c2, subject_schedule=self.schedule, seat_number=2
        )

    def _make_fake_file(self, name="scan.pdf"):
        return SimpleUploadedFile(
            name, b"%PDF-1.4 fake content", content_type="application/pdf"
        )

    def test_upload_creates_code_and_copy(self):
        response = self.client.post(
            "/api/anonymization/upload/",
            {
                "application_number": "A-01",
                "session_id": self.session.id,
                "file": self._make_fake_file(),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("anonymous_code", response.data)
        code = response.data["anonymous_code"]
        self.assertTrue(code.startswith("DOCT-2026-"))

        ac = AnonymousCode.objects.get(code=code)
        decrypted = decrypt_candidate_id(ac.candidate_id_encrypted)
        self.assertEqual(decrypted, self.c1.id)

        copy = ExamCopy.objects.get(anonymous_code=ac)
        self.assertTrue(copy.file.name.endswith(".pdf"))

    def test_duplicate_upload_rejected(self):
        self.client.post(
            "/api/anonymization/upload/",
            {
                "application_number": "A-01",
                "session_id": self.session.id,
                "file": self._make_fake_file(),
            },
            format="multipart",
        )
        response = self.client.post(
            "/api/anonymization/upload/",
            {
                "application_number": "A-01",
                "session_id": self.session.id,
                "file": self._make_fake_file(),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already exists", response.data["detail"])

    def test_unknown_application_number_rejected(self):
        response = self.client.post(
            "/api/anonymization/upload/",
            {
                "application_number": "X-99",
                "session_id": self.session.id,
                "file": self._make_fake_file(),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("No candidate found", response.data["detail"])

    def test_corrector_cannot_upload(self):
        self.client.force_authenticate(user=self.corrector)
        response = self.client.post(
            "/api/anonymization/upload/",
            {
                "application_number": "A-01",
                "session_id": self.session.id,
                "file": self._make_fake_file(),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_corrector_sees_only_assigned_copies(self):
        ac = AnonymousCode.objects.create(
            code="DOCT-2026-TEST",
            candidate_id_encrypted=encrypt_candidate_id(self.c1.id),
            exam_session_id=self.session.id,
        )
        copy = ExamCopy(anonymous_code=ac, uploaded_by_user_id=self.admin.id)
        copy.file.save("scan_test.pdf", ContentFile(b"%PDF-1.4 fake content"))

        self.client.force_authenticate(user=self.corrector)
        response = self.client.get("/api/anonymization/copies/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_admin_sees_full_copy_info(self):
        ac = AnonymousCode.objects.create(
            code="DOCT-2026-ADM",
            candidate_id_encrypted=encrypt_candidate_id(self.c1.id),
            exam_session_id=self.session.id,
        )
        copy = ExamCopy(anonymous_code=ac, uploaded_by_user_id=self.admin.id)
        copy.file.save("scan_adm.pdf", ContentFile(b"%PDF-1.4 fake content"))

        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/anonymization/copies/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("uploaded_by_user_id", response.data[0])

    def test_admin_sees_encrypted_code_correspondence(self):
        AnonymousCode.objects.create(
            code="DOCT-2026-SEC",
            candidate_id_encrypted=encrypt_candidate_id(self.c1.id),
            exam_session_id=self.session.id,
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/anonymization/codes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("candidate_id_encrypted", response.data[0])

    def test_coordinator_cannot_see_encrypted_ids(self):
        AnonymousCode.objects.create(
            code="DOCT-2026-CRD",
            candidate_id_encrypted=encrypt_candidate_id(self.c1.id),
            exam_session_id=self.session.id,
        )
        coordinator = User.objects.create_user(
            email="coord@test.local", role=RoleChoices.COORDINATOR, is_active=True
        )
        self.client.force_authenticate(user=coordinator)
        response = self.client.get("/api/anonymization/codes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("candidate_id_encrypted", response.data[0])


@override_settings(ANONYMIZATION_ENCRYPTION_KEY=FERNET_KEY)
class AnonymizationPVTests(TestCase):
    databases = "__all__"

    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@test.local", role=RoleChoices.ADMIN, is_active=True
        )
        self.session = ExamSession.objects.create(
            name="Automne 2026", year=2026, status=ExamSessionStatus.ACTIVE
        )
        self.subject = ExamSubject.objects.create(
            exam_session=self.session,
            name="Info",
            coefficient=1.0,
            pass_threshold=10.0,
        )
        self.room = ExamRoom.objects.create(
            exam_session=self.session, name="Salle A", capacity=10
        )
        self.schedule = SubjectSchedule.objects.create(
            subject=self.subject,
            room=self.room,
            exam_date="2026-10-10",
            start_time="09:00:00",
            duration_minutes=120,
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
        ExamAllocation.objects.create(
            candidate=self.c1, subject_schedule=self.schedule, seat_number=1
        )

    def _make_fake_file(self, name="scan.pdf"):
        return SimpleUploadedFile(
            name, b"%PDF-1.4 fake content", content_type="application/pdf"
        )

    def test_generate_pv_success(self):
        from apps.attendance.models import (
            AttendanceRecord,
            AttendanceStatus,
            AttendanceSubmission,
        )
        from apps.candidates.models import CandidateStatus

        sub = AttendanceSubmission.objects.create(
            exam_schedule=self.schedule, submitted_by=self.admin, is_finalized=True
        )
        AttendanceRecord.objects.create(
            submission=sub, candidate=self.c1, status=AttendanceStatus.PRESENT
        )

        upload_and_code_copy(
            session_id=self.session.id,
            application_number="A-01",
            uploaded_file=self._make_fake_file(),
            user=self.admin,
        )

        from .services import generate_anonymization_pv

        pv = generate_anonymization_pv(self.session.id, self.admin)
        self.assertEqual(pv.pv_type, PVType.ANONYMIZATION)
        self.assertIsNotNone(pv.file)

    def test_generate_pv_fails_if_incomplete(self):
        from .services import generate_anonymization_pv
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            generate_anonymization_pv(self.session.id, self.admin)
