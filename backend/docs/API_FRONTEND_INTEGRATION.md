# API Frontend Integration Guide

This guide explains how frontend should connect to the current backend skeleton.
For a complete endpoint/method/role list, also read `API_ENDPOINT_CATALOG.md`.

## 1. Base configuration

- Base URL: `http://127.0.0.1:8000`
- API prefix: `/api/`
- Auth type: JWT Bearer tokens
- API docs: `/api/docs/`

## 2. Roles (exact current enum)

- `ADMIN`
- `CFD_HEAD`
- `COORDINATOR`
- `CORRECTOR`
- `SUPERVISOR`
- `JURY_PRESIDENT`
- `JURY_MEMBER`
- `ANONYMITY_COMMISSION`

## 3. Authentication flow

### 3.1 Login

`POST /api/auth/login/`

Request:

```json
{
  "email": "admin@concours.local",
  "password": "StrongPass123!"
}
```

Response (SimpleJWT):

```json
{
  "refresh": "...",
  "access": "..."
}
```

### 3.2 Use access token

Add header:

```http
Authorization: Bearer <access_token>
```

### 3.3 Refresh token

`POST /api/auth/refresh/`

Request:

```json
{
  "refresh": "<refresh_token>"
}
```

### 3.4 Logout

`POST /api/auth/logout/`

Request:

```json
{
  "refresh": "<refresh_token>"
}
```

### 3.5 Current user

`GET /api/auth/me/`

### 3.6 Invite user (admin only)

`POST /api/auth/invites/`

Request:

```json
{
  "email": "user@concours.local",
  "first_name": "First",
  "last_name": "Last",
  "role": "COORDINATOR"
}
```

### 3.7 Set password from invite token

`POST /api/auth/set-password/`

Request:

```json
{
  "token": "invite-token",
  "password": "NewStrongPass123!"
}
```

## 4. Endpoint map by module

### Core utility

- `GET /api/health/`

### Candidates

- `/api/candidates/` (DRF ModelViewSet)

### Examinations

- `/api/examinations/sessions/`
- `/api/examinations/subjects/`
- `/api/examinations/rooms/`
- `/api/examinations/schedules/`

### Attendance

- `/api/attendance/submissions/`
- `/api/attendance/records/`

### Anonymization

- `/api/anonymization/codes/`
- `/api/anonymization/copies/`

### Correction

- `/api/correction/assignments/`
- `/api/correction/grades/`
- `/api/correction/discrepancies/`
- `/api/correction/locks/`

### Deliberation

- `/api/deliberation/runs/`
- `/api/deliberation/results/`
- `POST /api/deliberation/runs/{id}/close/`
- `POST /api/deliberation/runs/{id}/reopen/` (admin-only, audited)

Reopen request body:

```json
{
  "reason": "Operational correction requested by administration"
}
```

### PV

- `/api/pv/documents/`
- `/api/pv/signatures/`

### Audit

- `/api/audit/logs/` (admin-only read)

### Notifications

- `/api/notifications/outbox/`

### Import / Integrations

- `POST /api/import/candidates/`
- `/api/import/batches/`

## 5. Frontend integration rules (important)

- Do not call `/` as API root. Use `/api/...` routes.
- Treat many endpoints as scaffolded: response shapes may evolve.
- Use Swagger (`/api/docs/`) as source of truth for current schema.
- Handle `401` by refreshing token once, then forcing re-login if refresh fails.
- Handle `403` by role-aware UI (hide/disable unauthorized actions).

## 6. Known skeleton limitations for frontend

- Business workflows are incomplete in several modules.
- Many viewsets expose generic CRUD without finalized business constraints.
- Some actions currently return placeholder behavior in non-auth modules.
- Expect stricter validation and permission changes in future iterations.
