# API Frontend Integration Guide

Complete guide for frontend integration with the ConcoursDoctor backend.
For the full endpoint/method/role table, see `API_ENDPOINT_CATALOG.md`.

## 1. Base Configuration

- Base URL: `http://127.0.0.1:8000`
- API prefix: `/api/`
- Auth: JWT Bearer tokens
- API docs: `/api/docs/` (Swagger UI)
- OpenAPI schema: `/api/schema/`

## 2. Roles (8 roles, enforced per-module)

| Role | Typical Actions |
|---|---|
| `ADMIN` | Full access to all modules |
| `CFD_HEAD` | Record subjects, lottery, read call lists, view PVs |
| `COORDINATOR` | Read call lists, view anonymous codes, manage corrections |
| `CORRECTOR` | View assigned copies only, enter grades |
| `SUPERVISOR` | Mark attendance, read call lists |
| `JURY_PRESIDENT` | Close deliberation, view results |
| `JURY_MEMBER` | View deliberation results |
| `ANONYMITY_COMMISSION` | Upload copies + generate anonymous codes |

## 3. Authentication Flow

### 3.1 Login

`POST /api/auth/login/`

```json
{ "email": "admin@concours.local", "password": "StrongPass123!" }
```

Response:
```json
{ "refresh": "...", "access": "..." }
```

- Access token: 8h lifetime
- Refresh token: 24h lifetime
- 3 failed attempts → 15min account lockout

### 3.2 Use Access Token

```http
Authorization: Bearer <access_token>
```

### 3.3 Refresh Token

`POST /api/auth/refresh/`

```json
{ "refresh": "<refresh_token>" }
```

Returns new `{access, refresh}`. Old refresh is blacklisted.

### 3.4 Logout

`POST /api/auth/logout/` (authenticated)

```json
{ "refresh": "<refresh_token>" }
```

Blacklists the refresh token.

### 3.5 Current User

`GET /api/auth/me/` → `{id, email, first_name, last_name, role}`

### 3.6 Invite User (Admin only)

`POST /api/auth/invites/`

```json
{
  "email": "user@concours.local",
  "first_name": "First",
  "last_name": "Last",
  "role": "COORDINATOR"
}
```

Response:
```json
{
  "user": { "id": 2, "email": "user@concours.local", "role": "COORDINATOR", "is_active": false },
  "invite_link": "http://localhost:5173/set-password?token=..."
}
```

The user is created as **inactive**. They must set their password via the invite link.

### 3.7 Set Password from Invite

`POST /api/auth/set-password/` (public, requires valid invite token)

```json
{ "token": "invite-token-from-link", "password": "NewStrongPass123!" }
```

On success, the user's account is activated (`is_active: true`).

---

## 4. Exam Lifecycle Workflow

The frontend should guide users through these stages in order:

### Stage 1: Candidate Import

`POST /api/import/candidates/` (JSON) or `POST /api/import/candidates/file/` (CSV/XLSX)

### Stage 2: Examination Planning

1. Admin creates session → subjects → rooms → schedules
2. `POST /api/examinations/schedules/{id}/auto_allocate/` — randomly assigns candidates to rooms
3. CFD Head: `POST /api/examinations/sessions/{id}/record_subjects/` → PV of Subject Creation
4. CFD Head: `POST /api/examinations/sessions/{id}/lottery/` with `{selected_subject_id}` → PV of Subject Lottery
5. Supervisor reads call lists: `GET /api/examinations/schedules/{id}/call_list/`

### Stage 3: Attendance

1. Supervisor creates an `AttendanceSubmission` for a schedule
2. Supervisor marks candidates: `POST /api/attendance/records/` with `{submission, candidate, status: "PRESENT"/"ABSENT"}`
3. Can undo: `POST /api/attendance/records/{id}/undo/`
4. Can toggle: `POST /api/attendance/records/{id}/toggle/`
5. Check progress: `GET /api/attendance/submissions/{id}/counter/`
6. Bulk CSV import: `POST /api/attendance/submissions/{id}/import_csv/` (multipart: `file`)
7. Finalize: `POST /api/attendance/submissions/{id}/finalize/`
   - Validates all candidates marked
   - ABSENT candidates → ELIMINATED globally
   - Auto-generates PV of Attendance

Response:
```json
{
  "submission": { ... },
  "pv_document_id": 1,
  "pv_document_identifier": "PV-A1B2C3D4E5F6"
}
```

### Stage 4: Anonymization

1. Anonymity Commission uploads copies: `POST /api/anonymization/upload/` (multipart: `file`, `application_number`, `session_id`)
   - System auto-generates `DOCT-YYYY-XXXX` anonymous code
   - Encrypts candidate_id → Fernet
   - Links copy to code
2. Check progress: `GET /api/anonymization/copies/progress/{session_id}/`
3. When complete: `POST /api/anonymization/copies/generate-pv/{session_id}/` → PV of Anonymization

### Stage 5: Correction (NOT YET IMPLEMENTED)

Skeleton endpoints exist. Full workflow pending.

### Stage 6: Deliberation (PARTIAL)

1. Create a `DeliberationRun` for a session
2. Close: `POST /api/deliberation/runs/{id}/close/`
3. Reopen (admin only): `POST /api/deliberation/runs/{id}/reopen/` with `{reason: "..."}`

---

## 5. Key Response Shapes

### Attendance Counter

`GET /api/attendance/submissions/{id}/counter/`

```json
{
  "submission_id": 1,
  "schedule_id": 1,
  "total_expected": 12,
  "total_marked": 8,
  "total_unmarked": 4,
  "present_count": 7,
  "absent_count": 1,
  "is_finalized": false
}
```

### Call List (per room)

`GET /api/examinations/schedules/{id}/call_list/`

```json
[
  { "seat_number": 1, "application_number": "A-01", "full_name": "Doe John", "room": "Salle A" },
  { "seat_number": 2, "application_number": "A-02", "full_name": "Smith Jane", "room": "Salle A" }
]
```

### Call List (consolidated per subject)

`GET /api/examinations/subjects/{id}/call_list/`

```json
[
  {
    "exam_date": "2026-10-10",
    "start_time": "09:00:00",
    "room": "Salle A",
    "duration_minutes": 120,
    "candidates": [ ... ]
  }
]
```

### Anonymization Upload Response

`POST /api/anonymization/upload/`

```json
{
  "id": 1,
  "anonymous_code": "DOCT-2026-A3F7",
  "file": "/media/pv/scan_001.pdf",
  "created_at": "2026-04-13T10:00:00Z"
}
```

### Auto-Allocation Result

`POST /api/examinations/schedules/{id}/auto_allocate/`

```json
{
  "schedule_id": 1,
  "candidates_allocated": 12,
  "rooms_used": 2,
  "per_room": 6
}
```

### CSV Import Result

`POST /api/attendance/submissions/{id}/import_csv/`

```json
{
  "created": 10,
  "skipped_duplicates": 2,
  "errors": [
    { "row": 5, "message": "Invalid status 'LATE'. Must be PRESENT or ABSENT." }
  ]
}
```

---

## 6. Frontend Integration Rules

- Always use `/api/...` routes, never `/` as API root.
- Use Swagger (`/api/docs/`) as the source of truth for current schema.
- Handle `401` by refreshing token once, then force re-login if refresh fails.
- Handle `403` with role-aware UI: hide/disable unauthorized actions per role.
- All file uploads use `multipart/form-data`.
- Pagination follows DRF defaults: `{count, next, previous, results}`.
- Dates in `YYYY-MM-DD`, times in `HH:MM:SS`, datetimes in ISO 8601.

## 7. Module Maturity Map

| Module | Status | Frontend Notes |
|---|---|---|---|
| Auth | **Complete** | Full login/logout/invite flow working |
| Integrations | **Complete** | JSON + file import working |
| Attendance | **Complete** | All 7 SRS requirements implemented |
| Anonymization | **Complete** | Upload + code generation + PV working |
| Examinations | **Complete** | Planning + allocation + call lists + lottery working |
| Notifications | **Complete** | Convocation dispatch working |
| Audit | **Near complete** | Login/logout + all domain events logged |
| Accounts | **Complete** | RBAC, lockout, invite, audit all working |
| PV | **Partial** | 4 of 6 PV types generated (text format) |
| Deliberation | **Partial** | Close/reopen only; computation engine missing |
| Correction | **Scaffold** | Models only; no business logic |
| Candidates | **Scaffold** | CRUD only; no deactivate logic |
