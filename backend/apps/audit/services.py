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
