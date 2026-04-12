from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import RoleChoices
from apps.candidates.models import Candidate, CandidateStatus
from apps.examinations.models import ExamRoom, ExamSession, ExamSessionStatus, ExamSubject, SubjectSchedule

from .models import NotificationOutbox, NotificationStatus
from .tasks import send_convocation_email_task


class ConvocationWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_model = get_user_model()
        self.admin = self.user_model.objects.create_user(
            email="admin.notify@test.local",
            role=RoleChoices.ADMIN,
            is_active=True,
        )
        self.url = "/api/notifications/dispatch-convocations/"

        # Setup standard environment: 1 active session, 1 subject, 1 room, 1 schedule
        self.session = ExamSession.objects.create(name="Automne 2026", year=2026, status=ExamSessionStatus.ACTIVE)
        self.subject = ExamSubject.objects.create(
            exam_session=self.session, name="Informatique", coefficient=1.0, pass_threshold=10.0
        )
        self.room = ExamRoom.objects.create(exam_session=self.session, name="Salle A", capacity=10)
        self.schedule = SubjectSchedule.objects.create(
            subject=self.subject,
            room=self.room,
            exam_date="2026-10-10",
            start_time="09:00:00",
            duration_minutes=120,
        )

        # Candidates
        self.c1 = Candidate.objects.create(
            national_id="NAT-01",
            first_name="Alan",
            last_name="Turing",
            email="alan@test.local",
            phone="0555000001",
            application_number="APP-01",
            status=CandidateStatus.REGISTERED,
        )
        self.c2 = Candidate.objects.create(
            national_id="NAT-02",
            first_name="Ada",
            last_name="Lovelace",
            email="ada@test.local",
            phone="0555000002",
            application_number="APP-02",
            status=CandidateStatus.REGISTERED,
        )
        self.c3_absent = Candidate.objects.create(
            national_id="NAT-03",
            first_name="John",
            last_name="von Neumann",
            email="john@test.local",
            phone="0555000003",
            application_number="APP-03",
            status=CandidateStatus.ABSENT,  # Not registered
        )

    def test_celery_task_creates_outbox_and_sends_email(self):
        # Explicitly call task
        send_convocation_email_task(self.c1.id)

        # Assert email sent
        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertEqual(email.subject, "Convocation au Concours de Doctorat")
        self.assertEqual(email.to, ["alan@test.local"])
        self.assertIn("Alan Turing", email.body)
        self.assertIn("Informatique", email.body)
        self.assertIn("Salle A", email.body)
        self.assertIn("120 min", email.body)

        # Assert outbox record created
        self.assertEqual(NotificationOutbox.objects.count(), 1)
        outbox = NotificationOutbox.objects.get()
        self.assertEqual(outbox.recipient, "alan@test.local")
        self.assertEqual(outbox.status, NotificationStatus.SENT)
        self.assertIsNotNone(outbox.sent_at)

    @patch("apps.notifications.tasks.send_mail")
    def test_celery_task_handles_email_failure(self, mock_send_mail):
        mock_send_mail.side_effect = Exception("SMTP Connection Timeout")

        with self.assertRaises(Exception):
            send_convocation_email_task(self.c1.id)

        self.assertEqual(len(mail.outbox), 0)

        # Assert outbox record created with FAILED status
        self.assertEqual(NotificationOutbox.objects.count(), 1)
        outbox = NotificationOutbox.objects.get()
        self.assertEqual(outbox.recipient, "alan@test.local")
        self.assertEqual(outbox.status, NotificationStatus.FAILED)
        self.assertIsNone(outbox.sent_at)
        self.assertEqual(outbox.error_message, "SMTP Connection Timeout")

    @patch("apps.notifications.views.send_convocation_email_task.delay")
    def test_dispatch_convocations_queues_tasks(self, mock_delay):
        self.client.force_authenticate(user=self.admin)
        
        # Add a pre-existing PENDING outbox for c2 so they get skipped
        NotificationOutbox.objects.create(
            recipient=self.c2.email,
            subject="Convocation au Concours de Doctorat",
            status=NotificationStatus.PENDING,
        )

        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 202)
        # Should only queue c1. c2 has pending outbox. c3 is ABSENT.
        self.assertEqual(response.data["detail"], "Dispatched 1 convocation emails.")
        mock_delay.assert_called_once_with(self.c1.id)

    def test_dispatch_convocations_rejects_non_admin(self):
        coordinator = self.user_model.objects.create_user(
            email="coord@test.local", role=RoleChoices.COORDINATOR, is_active=True
        )
        self.client.force_authenticate(user=coordinator)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, 403)
