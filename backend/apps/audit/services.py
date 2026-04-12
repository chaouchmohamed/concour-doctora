from .models import AuditLog


def log_action(
    *,
    user,
    role: str,
    ip_address: str | None,
    action_type: str,
    affected_object_type: str,
    affected_object_id: int | None,
    details: dict | None = None,
) -> AuditLog:
    """
    Central helper for append-only sensitive-action logging.
    """
    return AuditLog.objects.create(
        user=user,
        role=role,
        ip_address=ip_address,
        action_type=action_type,
        affected_object_type=affected_object_type,
        affected_object_id=affected_object_id,
        details=details or {},
    )

def log_event(
    user,
    target,
    action: str,
    details: dict | None = None,
) -> AuditLog:
    """
    Simpler wrapper for log_action that derives object types and IDs.
    Defaults IP to None and role to user's role if available.
    """
    role = getattr(user, "role", "SYSTEM") if user else "SYSTEM"
    return log_action(
        user=user,
        role=role,
        ip_address=None,
        action_type=action,
        affected_object_type=target.__class__.__name__,
        affected_object_id=getattr(target, "id", None),
        details=details or {},
    )
