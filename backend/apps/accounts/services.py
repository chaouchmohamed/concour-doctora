import hashlib
import secrets
from datetime import timedelta
from dataclasses import dataclass

from django.conf import settings
from django.utils import timezone

from .models import User, UserInvite


@dataclass
class InvitePayload:
    invite: UserInvite
    raw_token: str


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def issue_user_invite(*, user: User, invited_by: User | None, expires_in_hours: int = 48) -> InvitePayload:
    raw_token = secrets.token_urlsafe(48)
    token_hash = _hash_token(raw_token)

    invite = UserInvite.objects.create(
        user=user,
        invited_by=invited_by,
        token_hash=token_hash,
        expires_at=timezone.now() + timedelta(hours=expires_in_hours),
    )
    return InvitePayload(invite=invite, raw_token=raw_token)


def get_usable_invite(raw_token: str) -> UserInvite:
    token_hash = _hash_token(raw_token)
    invite = UserInvite.objects.select_related("user").get(token_hash=token_hash)
    if not invite.is_usable:
        raise ValueError("Invite is expired or already used")
    return invite


def build_invite_link(raw_token: str) -> str:
    frontend_base = getattr(settings, "FRONTEND_INVITE_URL", "http://localhost:5173/set-password")
    return f"{frontend_base}?token={raw_token}"
