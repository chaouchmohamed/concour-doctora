from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.audit.models import ActionType, AuditLog

from .models import RoleChoices, User, UserInvite
from .services import get_usable_invite, issue_user_invite

User = get_user_model()


class RoleChoicesTests(TestCase):
    def test_all_8_roles_exist(self):
        self.assertEqual(len(RoleChoices.choices), 8)
        expected = {
            "ADMIN",
            "CFD_HEAD",
            "COORDINATOR",
            "CORRECTOR",
            "SUPERVISOR",
            "JURY_PRESIDENT",
            "JURY_MEMBER",
            "ANONYMITY_COMMISSION",
        }
        self.assertEqual(set(RoleChoices.values), expected)


class LoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="user@test.local",
            password="StrongPass123!",
            role=RoleChoices.ADMIN,
            is_active=True,
        )

    def test_login_success(self):
        response = self.client.post(
            "/api/auth/login/",
            {
                "email": "user@test.local",
                "password": "StrongPass123!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_creates_audit_log(self):
        self.client.post(
            "/api/auth/login/",
            {
                "email": "user@test.local",
                "password": "StrongPass123!",
            },
        )
        log = AuditLog.objects.filter(
            action_type=ActionType.LOGIN,
            affected_object_id=self.user.id,
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.details["event"], "USER_LOGIN")

    def test_login_wrong_password(self):
        response = self.client.post(
            "/api/auth/login/",
            {
                "email": "user@test.local",
                "password": "WrongPassword!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_email(self):
        response = self.client.post(
            "/api/auth/login/",
            {
                "email": "nobody@test.local",
                "password": "Whatever123!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_inactive_user(self):
        self.user.is_active = False
        self.user.save()
        response = self.client.post(
            "/api/auth/login/",
            {
                "email": "user@test.local",
                "password": "StrongPass123!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AccountLockoutTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="locked@test.local",
            password="StrongPass123!",
            role=RoleChoices.ADMIN,
            is_active=True,
        )

    def test_three_failures_locks_account(self):
        for _ in range(3):
            self.client.post(
                "/api/auth/login/",
                {
                    "email": "locked@test.local",
                    "password": "WrongPass!",
                },
            )
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_locked)
        self.assertEqual(self.user.failed_login_attempts, 3)

    def test_locked_account_rejected(self):
        for _ in range(3):
            self.client.post(
                "/api/auth/login/",
                {
                    "email": "locked@test.local",
                    "password": "WrongPass!",
                },
            )
        response = self.client.post(
            "/api/auth/login/",
            {
                "email": "locked@test.local",
                "password": "StrongPass123!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("locked", response.data["detail"].lower())

    def test_successful_login_clears_counters(self):
        self.user.failed_login_attempts = 2
        self.user.save()
        self.client.post(
            "/api/auth/login/",
            {
                "email": "locked@test.local",
                "password": "StrongPass123!",
            },
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.failed_login_attempts, 0)
        self.assertIsNone(self.user.locked_until)


class LogoutTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="user@test.local",
            password="StrongPass123!",
            role=RoleChoices.ADMIN,
            is_active=True,
        )
        login_resp = self.client.post(
            "/api/auth/login/",
            {
                "email": "user@test.local",
                "password": "StrongPass123!",
            },
        )
        self.refresh = login_resp.data["refresh"]
        self.access = login_resp.data["access"]

    def test_logout_blacklists_refresh(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")
        response = self.client.post("/api/auth/logout/", {"refresh": self.refresh})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout_creates_audit_log(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")
        self.client.post("/api/auth/logout/", {"refresh": self.refresh})
        log = AuditLog.objects.filter(
            action_type=ActionType.LOGOUT,
            affected_object_id=self.user.id,
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.details["event"], "USER_LOGOUT")

    def test_refresh_token_reused_after_logout_fails(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")
        self.client.post("/api/auth/logout/", {"refresh": self.refresh})
        response = self.client.post("/api/auth/refresh/", {"refresh": self.refresh})
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_400_BAD_REQUEST],
        )


class InviteFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@test.local",
            password="AdminPass123!",
            role=RoleChoices.ADMIN,
            is_active=True,
        )
        self.client.force_authenticate(user=self.admin)

    def test_admin_can_invite_user_with_role(self):
        response = self.client.post(
            "/api/auth/invites/",
            {
                "email": "newuser@test.local",
                "first_name": "New",
                "last_name": "User",
                "role": RoleChoices.CORRECTOR,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"]["role"], RoleChoices.CORRECTOR)
        self.assertIn("invite_link", response.data)

        user = User.objects.get(email="newuser@test.local")
        self.assertFalse(user.is_active)
        self.assertEqual(user.role, RoleChoices.CORRECTOR)

    def test_invite_creates_audit_log(self):
        self.client.post(
            "/api/auth/invites/",
            {
                "email": "audited@test.local",
                "role": RoleChoices.SUPERVISOR,
            },
        )
        log = AuditLog.objects.filter(details__event="USER_INVITED").first()
        self.assertIsNotNone(log)

    def test_duplicate_email_rejected(self):
        User.objects.create_user(
            email="dup@test.local",
            role=RoleChoices.CORRECTOR,
            is_active=True,
        )
        response = self.client.post(
            "/api/auth/invites/",
            {
                "email": "dup@test.local",
                "role": RoleChoices.SUPERVISOR,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_admin_cannot_invite(self):
        corrector = User.objects.create_user(
            email="corr@test.local",
            password="CorrPass123!",
            role=RoleChoices.CORRECTOR,
            is_active=True,
        )
        self.client.force_authenticate(user=corrector)
        response = self.client.post(
            "/api/auth/invites/",
            {
                "email": "nope@test.local",
                "role": RoleChoices.SUPERVISOR,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_set_password_activates_user(self):
        invite_resp = self.client.post(
            "/api/auth/invites/",
            {
                "email": "activate@test.local",
                "role": RoleChoices.COORDINATOR,
            },
        )
        invite_link = invite_resp.data["invite_link"]
        token = invite_link.split("token=")[-1]

        self.client.force_authenticate(user=None)
        response = self.client.post(
            "/api/auth/set-password/",
            {
                "token": token,
                "password": "NewSecurePass456!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user = User.objects.get(email="activate@test.local")
        self.assertTrue(user.is_active)
        self.assertTrue(user.check_password("NewSecurePass456!"))

    def test_set_password_creates_audit_log(self):
        invite_resp = self.client.post(
            "/api/auth/invites/",
            {
                "email": "auditpw@test.local",
                "role": RoleChoices.COORDINATOR,
            },
        )
        token = invite_resp.data["invite_link"].split("token=")[-1]
        self.client.force_authenticate(user=None)
        self.client.post(
            "/api/auth/set-password/",
            {
                "token": token,
                "password": "AuditPass789!",
            },
        )
        log = AuditLog.objects.filter(details__event="PASSWORD_SET_FROM_INVITE").first()
        self.assertIsNotNone(log)

    def test_expired_invite_rejected(self):
        from django.utils import timezone
        from datetime import timedelta

        user = User.objects.create_user(
            email="expired@test.local",
            role=RoleChoices.SUPERVISOR,
            is_active=False,
        )
        invite = UserInvite.objects.create(
            user=user,
            invited_by=self.admin,
            token_hash="fakehash",
            expires_at=timezone.now() - timedelta(hours=1),
        )
        response = self.client.post(
            "/api/auth/set-password/",
            {
                "token": "fake_raw_token",
                "password": "SomePassword123!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_used_invite_rejected(self):
        from django.utils import timezone

        user = User.objects.create_user(
            email="used@test.local",
            role=RoleChoices.SUPERVISOR,
            is_active=False,
        )
        payload = issue_user_invite(user=user, invited_by=self.admin)
        user_invite = payload.invite
        user_invite.used_at = timezone.now()
        user_invite.save()

        response = self.client.post(
            "/api/auth/set-password/",
            {
                "token": payload.raw_token,
                "password": "SomePassword123!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class MeViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="me@test.local",
            password="MePass123!",
            role=RoleChoices.COORDINATOR,
            is_active=True,
        )

    def test_me_returns_current_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "me@test.local")
        self.assertEqual(response.data["role"], RoleChoices.COORDINATOR)

    def test_me_unauthenticated(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@test.local",
            password="AdminPass123!",
            role=RoleChoices.ADMIN,
            is_active=True,
        )
        self.user = User.objects.create_user(
            email="managed@test.local",
            password="UserPass123!",
            role=RoleChoices.CORRECTOR,
            is_active=True,
        )

    def test_admin_can_list_users(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/auth/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_can_update_user_role(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f"/api/auth/users/{self.user.id}/",
            {"role": RoleChoices.COORDINATOR},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, RoleChoices.COORDINATOR)

    def test_non_admin_cannot_list_users(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/auth/users/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_admin_cannot_update_users(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            f"/api/auth/users/{self.admin.id}/",
            {"role": RoleChoices.CORRECTOR},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
