from django.test import TestCase
from django.contrib.auth import get_user_model
from .services import log_event
from .models import AuditLog, ActionType

User = get_user_model()

class AuditServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="password",
            role="ADMIN"
        )

    def test_log_event_derives_metadata(self):
        # We can use the user itself as a target for testing purposes
        target = self.user
        log = log_event(
            user=self.user,
            target=target,
            action=ActionType.CREATE,
            details={"foo": "bar"}
        )

        self.assertEqual(AuditLog.objects.count(), 1)
        self.assertEqual(log.action_type, ActionType.CREATE)
        self.assertEqual(log.affected_object_type, "User")
        self.assertEqual(log.affected_object_id, target.id)
        self.assertEqual(log.role, "ADMIN")
        self.assertEqual(log.details, {"foo": "bar"})
