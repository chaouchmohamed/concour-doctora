# API Endpoint Catalog

Complete endpoint map for frontend integration. Current as of 2026-04-13.

## Base

- Base URL: `http://127.0.0.1:8000`
- API prefix: `/api/`
- Auth: `Authorization: Bearer <access_token>`
- Swagger UI: `/api/docs/`
- OpenAPI Schema: `/api/schema/`

---

## Auth Module (`/api/auth/`)

| Endpoint | Method | Access | SRS Ref | Description |
|---|---|---|---|---|
| `/api/auth/login/` | POST | Public | AUTH-01 | JWT login → `{access, refresh}` |
| `/api/auth/refresh/` | POST | Public | AUTH-01 | Refresh access token |
| `/api/auth/logout/` | POST | Authenticated | AUTH-02 | Blacklist refresh token |
| `/api/auth/me/` | GET | Authenticated | — | Current user profile |
| `/api/auth/invites/` | POST | ADMIN | AUTH-05 | Invite user (email + role) → returns invite_link |
| `/api/auth/set-password/` | POST | Public (token) | AUTH-05 | Set password from invite token → activates account |
| `/api/auth/users/` | GET | ADMIN | — | List users |
| `/api/auth/users/{id}/` | GET, PATCH | ADMIN | — | Retrieve/update user |

---

## Health / Docs

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/health/` | GET | Public | Health check |
| `/api/docs/` | GET | Public | Swagger UI |
| `/api/schema/` | GET | Public | OpenAPI 3.0 schema |

---

## Candidates Module (`/api/candidates/`)

| Endpoint | Method | Access | SRS Ref | Description |
|---|---|---|---|---|
| `/api/candidates/candidates/` | GET, POST | ADMIN write, 4 roles read | CAND-05 | CRUD (skeleton) |
| `/api/candidates/candidates/{id}/` | GET, PUT, PATCH, DELETE | ADMIN write, 4 roles read | CAND-05 | CRUD (skeleton) |

---

## Examinations Module (`/api/examinations/`)

| Endpoint | Method | Access | SRS Ref | Description |
|---|---|---|---|---|
| `/api/examinations/sessions/` | CRUD | ADMIN write, 4 roles read | — | Manage exam sessions |
| `/api/examinations/sessions/{id}/` | GET, PUT, PATCH | ADMIN write, 4 roles read | — | Session detail |
| `/api/examinations/sessions/{id}/record_subjects/` | POST | ADMIN, CFD_HEAD | PV-01 | Record subjects submitted → generate PV of Subject Creation |
| `/api/examinations/sessions/{id}/lottery/` | POST | ADMIN, CFD_HEAD | EXAM-05 | Record lottery result (body: `{selected_subject_id}`) → generate PV of Subject Lottery |
| `/api/examinations/subjects/` | CRUD | ADMIN write, 4 roles read | EXAM-01 | Manage subjects (with validation) |
| `/api/examinations/subjects/{id}/call_list/` | GET | ADMIN, CFD_HEAD, COORD, SUPER | EXAM-03/04 | Consolidated call list per subject |
| `/api/examinations/rooms/` | CRUD | ADMIN write, 4 roles read | — | Manage rooms |
| `/api/examinations/schedules/` | CRUD | ADMIN write, 4 roles read | EXAM-02 | Manage schedules |
| `/api/examinations/schedules/{id}/auto_allocate/` | POST | ADMIN | EXAM-02 | Randomly allocate candidates to rooms+seats |
| `/api/examinations/schedules/{id}/call_list/` | GET | ADMIN, CFD_HEAD, COORD, SUPER | EXAM-03/04 | Per-room call list |
| `/api/examinations/allocations/` | GET | 4 roles read | — | View allocations (read-only) |

---

## Attendance Module (`/api/attendance/`)

| Endpoint | Method | Access | SRS Ref | Description |
|---|---|---|---|---|
| `/api/attendance/submissions/` | CRUD | ADMIN, SUPERVISOR | ATT-01 | Manage attendance submissions |
| `/api/attendance/submissions/{id}/finalize/` | POST | ADMIN, SUPERVISOR | ATT-05 | Finalize + absent→eliminated + generate PV of Attendance |
| `/api/attendance/submissions/{id}/counter/` | GET | ADMIN, SUPERVISOR | ATT-04 | Real-time marked/present/absent/unmarked counts |
| `/api/attendance/submissions/{id}/import_csv/` | POST | ADMIN, SUPERVISOR | ATT-07 | Bulk CSV import (multipart: `file`) |
| `/api/attendance/records/` | CRUD | ADMIN, SUPERVISOR | ATT-01 | Manage individual attendance records |
| `/api/attendance/records/{id}/undo/` | POST | ADMIN, SUPERVISOR | ATT-03 | Delete record (revert to unmarked) |
| `/api/attendance/records/{id}/toggle/` | POST | ADMIN, SUPERVISOR | ATT-03 | Switch PRESENT ↔ ABSENT |

---

## Anonymization Module (`/api/anonymization/`)

| Endpoint | Method | Access | SRS Ref | Description |
|---|---|---|---|---|
| `/api/anonymization/upload/` | POST | ADMIN, ANONYMITY_COMMISSION | ANON-03 | Upload copy + generate code (multipart: `file`, `application_number`, `session_id`) |
| `/api/anonymization/codes/` | GET | ADMIN, COORDINATOR | ANON-02 | List anonymous codes (no encrypted IDs for non-admin) |
| `/api/anonymization/copies/` | GET | ADMIN, ANON_COMM, COORD, CORRECTOR | ANON-04 | List exam copies (correctors see only assigned) |
| `/api/anonymization/copies/progress/{session_id}/` | GET | Same as copies | — | Coding progress counter |
| `/api/anonymization/copies/generate-pv/{session_id}/` | POST | Same as copies | ANON-05 | Generate PV of Anonymization |

---

## Correction Module (`/api/correction/`)

| Endpoint | Method | Access | SRS Ref | Description |
|---|---|---|---|---|
| `/api/correction/assignments/` | GET | ADMIN, COORD, CORRECTOR | COR-01/02 | List assignments (corrector sees own only, admin/coord sees all; `?subject_id=` filter) |
| `/api/correction/assignments/assign/` | POST | ADMIN, COORDINATOR | COR-01 | Bulk assign 2 correctors per copy for a subject (`{subject_id, corrector_ids}`) |
| `/api/correction/assignments/delete-subject/` | DELETE | ADMIN, COORDINATOR | — | Delete all assignments for a subject (`?subject_id=X`, blocked if grades exist) |
| `/api/correction/my-copies/` | GET | CORRECTOR | COR-02 | Get assigned copies with scan file URLs (`?subject_id=` filter) |
| `/api/correction/grades/` | GET | ADMIN, COORD, CORRECTOR | COR-03 | View grades (corrector sees own only; `?subject_id=` filter) |
| `/api/correction/grades/submit/` | POST | ADMIN, COORD, CORRECTOR | COR-03/04 | Submit grade `{anonymous_code, exam_subject_id, grade}` (auto-detects discrepancy) |
| `/api/correction/discrepancies/` | GET | ADMIN, COORDINATOR | COR-05 | View discrepancies (read-only) |
| `/api/correction/discrepancies/{id}/assign-third-corrector/` | POST | ADMIN, COORDINATOR | COR-06 | Assign third corrector `{third_corrector_id}` |
| `/api/correction/compute-final-grades/` | POST | ADMIN, COORDINATOR | COR-07 | Compute final grades `{subject_id}` per subject rule |
| `/api/correction/locks/` | GET | ADMIN, COORDINATOR | COR-08 | View grade locks |
| `/api/correction/locks/lock-subject/` | POST | ADMIN, COORDINATOR | COR-08 | Lock grades `{subject_id}` (validates prerequisites) |
| `/api/correction/generate-pv/` | POST | ADMIN, COORDINATOR | COR-09 | Generate PV of Correction `{subject_id}` (requires lock) |

---

## Deliberation Module (`/api/deliberation/`)

| Endpoint | Method | Access | SRS Ref | Description |
|---|---|---|---|---|
| `/api/deliberation/runs/` | GET, POST | ADMIN, JURY_PRES, JURY_MEM | DEL-01 | Manage deliberation runs |
| `/api/deliberation/runs/{id}/` | GET | ADMIN, JURY_PRES, JURY_MEM | — | Run detail |
| `/api/deliberation/runs/{id}/compute/` | POST | ADMIN, JURY_PRESIDENT | DEL-02/03/04 | Compute weighted averages, ranking, outcomes |
| `/api/deliberation/runs/{id}/close/` | POST | ADMIN, JURY_PRESIDENT | DEL-05/06 | Close deliberation + lift anonymity |
| `/api/deliberation/runs/{id}/reopen/` | POST | ADMIN only | DEL-05 | Reopen (requires reason, blocked if archived) |
| `/api/deliberation/runs/{id}/generate-pv/` | POST | ADMIN, JURY_PRESIDENT | DEL-07 | Generate PV of Deliberation |
| `/api/deliberation/runs/{id}/archive/` | POST | ADMIN, JURY_PRESIDENT | DEL-09 | Archive deliberation (immutable) |
| `/api/deliberation/results/` | GET | ADMIN, JURY_PRES, JURY_MEM | DEL-03 | View results (ranked by weighted average) |
| `/api/deliberation/sign-pv/` | POST | ADMIN, JURY_PRES, JURY_MEM | DEL-08 | Sign a deliberation PV `{pv_document_id}` |

---

## PV Module (`/api/pv/`)

| Endpoint | Method | Access | SRS Ref | Description |
|---|---|---|---|---|
| `/api/pv/documents/` | GET | ADMIN, CFD_HEAD | PV-01 | List PV documents |
| `/api/pv/documents/{id}/` | GET | ADMIN, CFD_HEAD | PV-01 | Retrieve PV document |
| `/api/pv/signatures/` | GET, POST | ADMIN | PV-03 | View/create signatures |

---

## Audit Module (`/api/audit/`)

| Endpoint | Method | Access | SRS Ref | Description |
|---|---|---|---|---|
| `/api/audit/logs/` | GET | ADMIN | LOG-04 | List audit logs (paginated) |
| `/api/audit/logs/{id}/` | GET | ADMIN | LOG-04 | Log detail |

---

## Notifications Module (`/api/notifications/`)

| Endpoint | Method | Access | SRS Ref | Description |
|---|---|---|---|---|
| `/api/notifications/outbox/` | GET | ADMIN | — | List notification outbox |
| `/api/notifications/outbox/{id}/` | GET | ADMIN | — | Outbox detail |
| `/api/notifications/dispatch-convocations/` | POST | ADMIN | CAND-04 | Dispatch convocation emails to candidates |

---

## Integrations Module (`/api/import/`)

| Endpoint | Method | Access | SRS Ref | Description |
|---|---|---|---|---|
| `/api/import/candidates/` | POST | ADMIN | CAND-01 | JSON import (array of candidate rows) |
| `/api/import/candidates/file/` | POST | ADMIN | CAND-01 | File import (CSV/XLSX, multipart: `file`) |
| `/api/import/batches/` | GET | ADMIN | — | List import batches |
| `/api/import/batches/{id}/` | GET | ADMIN | — | Batch detail |
