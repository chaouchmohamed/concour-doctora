from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.audit.models import AuditLog
from apps.deliberation.models import DeliberationRun, DeliberationStatus


class DeliberationReopenEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_model = get_user_model()

        self.admin = self.user_model.objects.create_user(
            email="admin@test.local",
            role="ADMIN",
            is_active=True,
        )
        self.jury = self.user_model.objects.create_user(
            email="jury@test.local",
            role="JURY_MEMBER",
            is_active=True,
        )

        self.deliberation = DeliberationRun.objects.create(
            exam_session_id=2026,
            status=DeliberationStatus.CLOSED,
            closed_by=self.admin,
        )

    def test_admin_can_reopen_closed_deliberation_and_write_audit_log(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            f"/api/deliberation/runs/{self.deliberation.id}/reopen/",
            {"reason": "Admin correction"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.deliberation.refresh_from_db()
        self.assertEqual(self.deliberation.status, DeliberationStatus.OPEN)
        self.assertIsNone(self.deliberation.closed_at)
        self.assertIsNone(self.deliberation.closed_by)

        self.assertTrue(
            AuditLog.objects.filter(
                action_type="DELIBERATION_REOPENED",
                affected_object_type="DeliberationRun",
                affected_object_id=self.deliberation.id,
            ).exists()
        )

    def test_non_admin_cannot_reopen_deliberation(self):
        self.client.force_authenticate(user=self.jury)

        response = self.client.post(
            f"/api/deliberation/runs/{self.deliberation.id}/reopen/",
            {"reason": "Try reopen"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_reopen_requires_reason(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            f"/api/deliberation/runs/{self.deliberation.id}/reopen/",
            {"reason": "   "},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
