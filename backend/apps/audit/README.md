# Audit Module

Immutable append-only audit log for all sensitive actions across the platform.

## Core Models

- **AuditLog**: timestamp, user, role, ip_address, action_type, affected_object_type, affected_object_id, details (JSONField)
- **ActionType**: CREATE, UPDATE, DELETE, IMPORT, EXPORT, LOGIN, LOGOUT, OTHER
- **ImmutableQuerySet/Manager**: Blocks `save()` on existing records, `delete()`, and queryset `delete()`

## Business Rules (SRS CD-FR-LOG-01 to 04)

1. **Immutable** (CD-FR-LOG-01): Audit logs cannot be updated or deleted at the ORM level. `save()` on existing records raises `PermissionDenied`. Queryset `delete()` also raises.
2. **Capture metadata** (CD-FR-LOG-02): Every log entry captures timestamp, user, role, IP address, action type, affected object type/ID, and arbitrary JSON details.
3. **Log sensitive actions** (CD-FR-LOG-03): Currently logging: login, logout, user invite, password set, attendance finalization/undo/toggle/import, anonymous code generation, copy upload, PV generation, candidate auto-allocation, lottery result, subjects submission. **Still missing**: grade entry, identity access, config changes.
4. **Admin-only access** (CD-FR-LOG-04): `AuditAdminOnlyPermission` restricts read access to ADMIN role. No write access via API.

## API Endpoints

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/audit/logs/` | GET | ADMIN | List audit logs (paginated) |
| `/api/audit/logs/{id}/` | GET | ADMIN | Retrieve single log entry |

## Services

- `log_action()` — low-level helper, all fields explicit
- `log_event(user, target, action, details, ip_address)` — simpler wrapper that derives object type/ID/role automatically. Now accepts optional `ip_address`.

## Tests

1 test covering metadata derivation. Auth actions (login/logout) are tested via `apps/accounts/tests.py`.
