import csv
import io

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import RoleChoices
from apps.candidates.models import Candidate

from .models import CandidateImportBatch


class CandidateImportEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_model = get_user_model()
        self.admin = self.user_model.objects.create_user(
            email="admin.import@test.local",
            role=RoleChoices.ADMIN,
            is_active=True,
        )
        self.coordinator = self.user_model.objects.create_user(
            email="coord.import@test.local",
            role=RoleChoices.COORDINATOR,
            is_active=True,
        )
        self.url = "/api/import/candidates/"

    def _candidate_payload(self, *, national_id: str, application_number: str, email: str) -> dict:
        return {
            "first_name": "Ada",
            "last_name": "Lovelace",
            "national_id": national_id,
            "email": email,
            "phone": "0555001122",
            "application_number": application_number,
        }

    def test_admin_can_import_valid_payload(self):
        self.client.force_authenticate(user=self.admin)
        payload = self._candidate_payload(
            national_id="NAT-100",
            application_number="APP-100",
            email="ada100@test.local",
        )

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, 202)
        self.assertEqual(Candidate.objects.count(), 1)
        candidate = Candidate.objects.get()
        self.assertEqual(candidate.national_id, "NAT-100")
        self.assertEqual(candidate.application_number, "APP-100")

        batch = CandidateImportBatch.objects.get()
        self.assertEqual(batch.total_rows, 1)
        self.assertEqual(batch.valid_rows, 1)
        self.assertEqual(batch.invalid_rows, 0)
        self.assertEqual(batch.status, "COMPLETED")

        self.assertEqual(response.data["report"]["imported_rows"], 1)
        self.assertEqual(response.data["report"]["invalid_rows"], 0)
        self.assertEqual(response.data["report"]["status"], "COMPLETED")

    def test_import_reports_duplicates_and_invalid_rows(self):
        Candidate.objects.create(
            first_name="Existing",
            last_name="Candidate",
            national_id="NAT-EXISTING",
            email="existing@test.local",
            phone="0666000000",
            application_number="APP-EXISTING",
        )
        self.client.force_authenticate(user=self.admin)
        payload = [
            self._candidate_payload(
                national_id="NAT-200",
                application_number="APP-200",
                email="valid200@test.local",
            ),
            self._candidate_payload(
                national_id="NAT-200",
                application_number="APP-201",
                email="dup-in-payload@test.local",
            ),
            self._candidate_payload(
                national_id="NAT-EXISTING",
                application_number="APP-202",
                email="dup-in-db@test.local",
            ),
            self._candidate_payload(
                national_id="NAT-203",
                application_number="APP-203",
                email="not-an-email",
            ),
        ]

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, 202)
        self.assertEqual(Candidate.objects.count(), 2)  # 1 existing + 1 imported

        batch = CandidateImportBatch.objects.latest("id")
        self.assertEqual(batch.total_rows, 4)
        self.assertEqual(batch.valid_rows, 1)
        self.assertEqual(batch.invalid_rows, 3)
        self.assertEqual(batch.status, "COMPLETED_WITH_ERRORS")

        self.assertEqual(response.data["report"]["imported_rows"], 1)
        self.assertEqual(response.data["report"]["invalid_rows"], 3)
        self.assertEqual(response.data["report"]["status"], "COMPLETED_WITH_ERRORS")

        error_rows = {entry["row"] for entry in response.data["report"]["errors"]}
        self.assertEqual(error_rows, {2, 3, 4})

    def test_all_invalid_rows_mark_batch_as_failed(self):
        self.client.force_authenticate(user=self.admin)
        payload = [
            {
                "first_name": "",
                "last_name": "Candidate",
                "national_id": "",
                "email": "invalid",
                "phone": "",
                "application_number": "",
            }
        ]

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, 202)
        self.assertEqual(Candidate.objects.count(), 0)

        batch = CandidateImportBatch.objects.get()
        self.assertEqual(batch.valid_rows, 0)
        self.assertEqual(batch.invalid_rows, 1)
        self.assertEqual(batch.status, "FAILED")
        self.assertEqual(response.data["report"]["status"], "FAILED")

    def test_non_admin_cannot_import_candidates(self):
        self.client.force_authenticate(user=self.coordinator)
        payload = self._candidate_payload(
            national_id="NAT-300",
            application_number="APP-300",
            email="ada300@test.local",
        )

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Candidate.objects.count(), 0)
        self.assertEqual(CandidateImportBatch.objects.count(), 0)


class CandidateFileImportEndpointTests(TestCase):
    """Tests for POST /api/import/candidates/file/."""

    def setUp(self):
        self.client = APIClient()
        self.user_model = get_user_model()
        self.admin = self.user_model.objects.create_user(
            email="admin.file@test.local",
            role=RoleChoices.ADMIN,
            is_active=True,
        )
        self.coordinator = self.user_model.objects.create_user(
            email="coord.file@test.local",
            role=RoleChoices.COORDINATOR,
            is_active=True,
        )
        self.url = "/api/import/candidates/file/"

    # ── helpers ───────────────────────────────────────────────

    def _make_csv(self, rows: list[dict]) -> io.BytesIO:
        """Build an in-memory CSV file from a list of dicts."""
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
        binary = io.BytesIO(buf.getvalue().encode("utf-8"))
        binary.name = "candidates.csv"
        return binary

    def _make_xlsx(self, rows: list[dict]) -> io.BytesIO:
        """Build an in-memory XLSX file from a list of dicts."""
        import openpyxl

        wb = openpyxl.Workbook()
        ws = wb.active
        headers = list(rows[0].keys())
        ws.append(headers)
        for row in rows:
            ws.append([row[h] for h in headers])
        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        buf.name = "candidates.xlsx"
        return buf

    def _valid_rows(self) -> list[dict]:
        return [
            {
                "first_name": "Ada",
                "last_name": "Lovelace",
                "national_id": "NAT-F01",
                "email": "ada.f01@test.local",
                "phone": "0555001122",
                "application_number": "APP-F01",
            },
            {
                "first_name": "Grace",
                "last_name": "Hopper",
                "national_id": "NAT-F02",
                "email": "grace.f02@test.local",
                "phone": "0555003344",
                "application_number": "APP-F02",
            },
        ]

    # ── tests ─────────────────────────────────────────────────

    def test_admin_can_import_valid_csv_file(self):
        self.client.force_authenticate(user=self.admin)
        csv_file = self._make_csv(self._valid_rows())

        response = self.client.post(self.url, {"file": csv_file}, format="multipart")

        self.assertEqual(response.status_code, 202)
        self.assertEqual(Candidate.objects.count(), 2)
        self.assertEqual(response.data["report"]["imported_rows"], 2)
        self.assertEqual(response.data["report"]["status"], "COMPLETED")

        batch = CandidateImportBatch.objects.latest("id")
        self.assertEqual(batch.source, "CSV")
        self.assertEqual(batch.valid_rows, 2)

    def test_admin_can_import_valid_xlsx_file(self):
        self.client.force_authenticate(user=self.admin)
        xlsx_file = self._make_xlsx(self._valid_rows())

        response = self.client.post(self.url, {"file": xlsx_file}, format="multipart")

        self.assertEqual(response.status_code, 202)
        self.assertEqual(Candidate.objects.count(), 2)
        self.assertEqual(response.data["report"]["imported_rows"], 2)
        self.assertEqual(response.data["report"]["status"], "COMPLETED")

        batch = CandidateImportBatch.objects.latest("id")
        self.assertEqual(batch.source, "XLSX")
        self.assertEqual(batch.valid_rows, 2)

    def test_file_import_rejects_unsupported_format(self):
        self.client.force_authenticate(user=self.admin)
        txt_file = io.BytesIO(b"some random text content")
        txt_file.name = "data.txt"

        response = self.client.post(self.url, {"file": txt_file}, format="multipart")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Candidate.objects.count(), 0)

    def test_file_import_with_invalid_rows_reports_errors(self):
        self.client.force_authenticate(user=self.admin)
        rows = [
            {
                "first_name": "Ada",
                "last_name": "Lovelace",
                "national_id": "NAT-MIX1",
                "email": "ada.mix@test.local",
                "phone": "0555001122",
                "application_number": "APP-MIX1",
            },
            {
                "first_name": "",
                "last_name": "Bad",
                "national_id": "",
                "email": "not-an-email",
                "phone": "",
                "application_number": "",
            },
        ]
        csv_file = self._make_csv(rows)

        response = self.client.post(self.url, {"file": csv_file}, format="multipart")

        self.assertEqual(response.status_code, 202)
        self.assertEqual(Candidate.objects.count(), 1)
        self.assertEqual(response.data["report"]["imported_rows"], 1)
        self.assertEqual(response.data["report"]["invalid_rows"], 1)
        self.assertEqual(response.data["report"]["status"], "COMPLETED_WITH_ERRORS")

    def test_non_admin_cannot_import_file(self):
        self.client.force_authenticate(user=self.coordinator)
        csv_file = self._make_csv(self._valid_rows())

        response = self.client.post(self.url, {"file": csv_file}, format="multipart")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Candidate.objects.count(), 0)
