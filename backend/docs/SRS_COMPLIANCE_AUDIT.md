# ConcoursDoctor Backend — SRS Compliance Audit

_Last updated: 2026-04-13_

---

## SRS Requirement Status Map

### Authentication & Access Control (CD-FR-AUTH-01 to 05)

| SRS ID | Requirement | Status | Detail |
|---|---|---|---|
| CD-FR-AUTH-01 | JWT login, 8h token | **BUILT** | `LoginView` + `CustomTokenObtainPairSerializer` with SimpleJWT, 8h/24h config in settings |
| CD-FR-AUTH-02 | Logout invalidates JWT | **BUILT** | `LogoutView` blacklists refresh token |
| CD-FR-AUTH-03 | 3 failed logins → 15min lock + notify admin | **PARTIAL** | Lockout logic exists in `User.register_failed_login()` and `CustomTokenObtainPairSerializer`. But `notify_admin_lockout_task` is a **stub** (empty body). No tests. |
| CD-FR-AUTH-04 | RBAC with 8 roles | **BUILT** | `RoleChoices` has all 8 roles. Permission classes enforce roles per-module. |
| CD-FR-AUTH-05 | Strict role-action mapping | **PARTIAL** | Some modules have proper role gates (attendance, notifications, audit). Others are skeleton permissions (candidates, examinations, anonymization). No object-level filtering yet (e.g., corrector sees only their copies). |

### Candidate Import & Management (CD-FR-CAND-01 to 05)

| SRS ID | Requirement | Status | Detail |
|---|---|---|---|
| CD-FR-CAND-01 | Import via CSV/Excel or REST API | **BUILT** | `POST /api/import/candidates/` (JSON) + `POST /api/import/candidates/file/` (CSV/XLSX). Full validation, 9 tests. |
| CD-FR-CAND-02 | Required fields in records | **BUILT** | `REQUIRED_FIELDS` validated in `integrations/services.py`. Model has all fields. |
| CD-FR-CAND-03 | Duplicate detection + report | **BUILT** | Duplicate checks (national_id, application_number) in payload and against DB. Per-row error report. |
| CD-FR-CAND-04 | Convocation email after scheduling | **BUILT** | `POST /api/notifications/dispatch-convocations/` + `send_convocation_email_task` with template rendering + outbox pattern. 4 tests. |
| CD-FR-CAND-05 | Manual add/edit/deactivate candidates | **STUB** | Bare `ModelViewSet` — no deactivate logic, no edit restrictions, no validation beyond model fields. No tests. |

### Examination Planning (CD-FR-EXAM-01 to 05)

| SRS ID | Requirement | Status | Detail |
|---|---|---|---|
| CD-FR-EXAM-01 | Define subjects (name, coeff, threshold, max) | **STUB** | Model exists with all fields. View is bare CRUD, no validation. No tests. |
| CD-FR-EXAM-02 | Schedule subjects (date, time, duration, rooms) | **STUB** | `SubjectSchedule` model exists. Bare CRUD. No tests. |
| CD-FR-EXAM-03 | Generate printable call list PDF | **MISSING** | No PDF generation, no call list endpoint. |
| CD-FR-EXAM-04 | Call list accessible digitally by supervisors | **MISSING** | No endpoint. |
| CD-FR-EXAM-05 | Subject lottery + PV | **MISSING** | No lottery endpoint, no PV of Subject Lottery. |

### Attendance Management (CD-FR-ATT-01 to 07)

| SRS ID | Requirement | Status | Detail |
|---|---|---|---|
| CD-FR-ATT-01 | Mark PRESENT/ABSENT via PWA | **BUILT** | `POST /api/attendance/records/` creates records. |
| CD-FR-ATT-02 | Offline mode + auto-sync | **MISSING** | PWA/frontend concern. Backend has no offline API. |
| CD-FR-ATT-03 | Undo before final submission | **BUILT** | `POST /api/attendance/records/{id}/undo/` + `toggle/`. Tested. |
| CD-FR-ATT-04 | Real-time counter | **BUILT** | `GET /api/attendance/submissions/{id}/counter/`. Tested. |
| CD-FR-ATT-05 | ABSENT → ELIMINATED propagation | **BUILT** | In `finalize_attendance()`. Tested. |
| CD-FR-ATT-06 | PV of Surveillance | **BUILT** | Auto-generated on finalize via `generate_attendance_pv()`. Text format (PDF upgrade pending). |
| CD-FR-ATT-07 | CSV fallback import | **BUILT** | `POST /api/attendance/submissions/{id}/import_csv/`. Tested. |

### Anonymization (CD-FR-ANON-01 to 05)

| SRS ID | Requirement | Status | Detail |
|---|---|---|---|
| CD-FR-ANON-01 | CSPRNG code in DOCT-YYYY-XXXX | **MISSING** | Model `AnonymousCode` exists but no generation service. |
| CD-FR-ANON-02 | Encrypted mapping in separate schema | **MISSING** | `candidate_id_encrypted` field exists but no encryption. DB router exists but no enforcement. |
| CD-FR-ANON-03 | Copy upload + code association | **STUB** | `ExamCopy` model exists. Bare CRUD view. No QR detection. |
| CD-FR-ANON-04 | Hide identity during correction | **MISSING** | No filtering/enforcement logic. |
| CD-FR-ANON-05 | PV of Anonymization | **MISSING** | No service. |

### Double Correction (CD-FR-COR-01 to 09)

| SRS ID | Requirement | Status | Detail |
|---|---|---|---|
| CD-FR-COR-01 | Assign 2 correctors per copy | **STUB** | `CorrectionAssignment` model exists. Bare CRUD. No business logic (must enforce exactly 2). |
| CD-FR-COR-02 | Corrector sees only their copies | **MISSING** | No queryset filtering by corrector. |
| CD-FR-COR-03 | Grade entry with score range enforcement | **PARTIAL** | `CopyGrade` model exists. Serializer has grade-lock check. No score range validation (0 to max_score). |
| CD-FR-COR-04 | Auto-calculate absolute difference | **MISSING** | No auto-detection on second grade entry. |
| CD-FR-COR-05 | Discrepancy alert to coordinator | **MISSING** | `GradeDiscrepancy` model exists. No trigger/creation logic. |
| CD-FR-COR-06 | Third corrector arbitration | **MISSING** | No endpoint, no UI-facing logic. |
| CD-FR-COR-07 | Final grade computation rule | **MISSING** | `FinalGradeRule` enum exists on `ExamSubject`. No computation service. |
| CD-FR-COR-08 | Grade lock after coordinator validation | **PARTIAL** | `SubjectGradeLock` model + serializer check exists. No coordinator "validate all" action. |
| CD-FR-COR-09 | PV of Correction | **MISSING** | No service. |

### Electronic Deliberation (CD-FR-DEL-01 to 09)

| SRS ID | Requirement | Status | Detail |
|---|---|---|---|
| CD-FR-DEL-01 | Jury-only access after all subjects validated | **PARTIAL** | Permission class allows JURY roles. No prerequisite check (subjects validated). |
| CD-FR-DEL-02 | Weighted average computation | **MISSING** | No service. |
| CD-FR-DEL-03 | Provisional ranking (anonymous codes) | **MISSING** | No ranking service. |
| CD-FR-DEL-04 | Admissibility threshold (ADMITTED/WAITING/REJECTED) | **MISSING** | `DeliberationOutcome` enum exists. No auto-flagging. |
| CD-FR-DEL-05 | Close deliberation (irreversible) | **PARTIAL** | `close_deliberation` action exists. Missing prerequisite checks. Only 3 tests (reopen only). |
| CD-FR-DEL-06 | Anonymity lifting on closure | **MISSING** | No logic. |
| CD-FR-DEL-07 | PV of Deliberation PDF | **MISSING** | No service. |
| CD-FR-DEL-08 | Electronic signatures on PV | **MISSING** | `PVSignature` model exists. No signing endpoint. |
| CD-FR-DEL-09 | Archive + immutability after closure | **MISSING** | No archival service. |

### PV Management (CD-FR-PV-01 to 03)

| SRS ID | Requirement | Status | Detail |
|---|---|---|---|
| CD-FR-PV-01 | Generate 6 PV types at correct stages | **PARTIAL** | Only PV of Attendance is implemented. 5 others missing. |
| CD-FR-PV-02 | PDF format + downloadable | **MISSING** | Currently text files. No PDF library in requirements. |
| CD-FR-PV-03 | Unique ID, timestamp, responsible actors | **PARTIAL** | `document_identifier` + `generated_at` + `generated_by` exist. No responsible actor names field. |

### Audit Logging (CD-FR-LOG-01 to 04)

| SRS ID | Requirement | Status | Detail |
|---|---|---|---|
| CD-FR-LOG-01 | Immutable audit log | **BUILT** | `AuditLog` with ORM-level immutability (save/update/delete all blocked). |
| CD-FR-LOG-02 | Capture timestamp, user, role, IP, action, object | **BUILT** | All fields present. `log_event()` auto-derives some. IP capture is inconsistent (often `None`). |
| CD-FR-LOG-03 | Log: login/logout, grade changes, identity access, PV gen, config changes | **PARTIAL** | Attendance actions, PV gen, deliberation close/reopen are logged. Login/logout, grade entry, identity access, config changes are **not logged**. |
| CD-FR-LOG-04 | Admin-only, not editable/deletable | **BUILT** | `AuditAdminOnlyPermission` + model-level immutability. |

---

## Module Maturity Summary

| Module | Real Tests | Real Services | SRS Coverage | Assessment |
|---|---|---|---|---|
| **integrations** | 9 | 243 lines | 3/3 CAND import | **Complete** |
| **attendance** | 20 | 173 lines | 6/7 ATT (offline is PWA) | **Complete** |
| **notifications** | 4 | 84 lines (tasks) | 1/1 CAND-04 | **Complete** |
| **audit** | 1 | 46 lines | 3/4 LOG | **Near complete** |
| **accounts** | 1 | 45 lines | 4/5 AUTH | **Needs tests + lockout email** |
| **pv** | 0 (indirect via ATT) | 68 lines | 1/6 PV types | **Early** |
| **deliberation** | 3 | 0 | 2/9 DEL | **Early** |
| **correction** | 0 | 0 | 1/9 COR | **Scaffold only** |
| **anonymization** | 0 | 0 | 0/5 ANON | **Scaffold only** |
| **examinations** | 0 | 0 | 0/5 EXAM | **Scaffold only** |
| **candidates** | 0 | 0 | 0/1 CAND-05 | **Scaffold only** |
| **common** | 0 | 0 | N/A | **Utility only** |

---

## Critical Path — Exam Lifecycle

```
Import ✓ → Plan ✗ → Attendance ✓ → Anonymize ✗ → Correct ✗ → Deliberate ✗ → PV ✗
```

---

## Recommended Next Slices

1. **Anonymization core** (CD-FR-ANON-01/02) — CSPRNG code generation + encrypted identity mapping
2. **Correction workflow** (CD-FR-COR-01–09) — assignment, discrepancy detection, grade computation
3. **Deliberation engine** (CD-FR-DEL-02–06) — weighted averages, ranking, anonymity lifting

---

## Per-App Detailed Audit

### accounts

- **Models**: REAL — `User` (lockout logic, invite FK), `UserInvite` (usability check), `RoleChoices` (8 roles)
- **Services**: REAL — `issue_user_invite()`, `get_usable_invite()`, `build_invite_link()`
- **Views**: REAL — Login, Refresh, Logout, Me, Invite, SetPassword, UserManagement
- **Tests**: STUB — 1 test (RoleChoices count only)
- **Permissions**: REAL — `IsAdminRole`, `HasAnyRole`, `IsSelfOrAdmin`
- **Serializers**: REAL — `InviteUserSerializer` (duplicate check + Celery), `SetPasswordFromInviteSerializer` (invite validation + activation), `CustomTokenObtainPairSerializer` (lockout counters)
- **Tasks**: STUB — `send_invite_email_task`, `notify_admin_lockout_task` have empty bodies
- **README**: None

### candidates

- **Models**: PARTIAL — `Candidate` is a plain data holder, no model methods
- **Services**: STUB — placeholder comment
- **Views**: STUB — bare `ModelViewSet`
- **Tests**: STUB — `PlaceholderTestCase.test_placeholder`
- **Permissions**: PARTIAL — skeleton RBAC, self-described as "tighten per endpoint"
- **Serializers**: STUB — plain ModelSerializer
- **README**: None

### examinations

- **Models**: REAL — 4 models with proper constraints (`ExamSession`, `ExamSubject`, `ExamRoom`, `SubjectSchedule`, `ExamAllocation`)
- **Services**: STUB — placeholder comment
- **Views**: STUB — 4 bare `ModelViewSet`s
- **Tests**: STUB — `PlaceholderTestCase.test_placeholder`
- **Permissions**: PARTIAL — basic role gate
- **Serializers**: STUB — `fields = "__all__"`, no validation
- **README**: None

### attendance

- **Models**: REAL — `AttendanceSubmission` (is_finalized gate), `AttendanceRecord` (unique_together)
- **Services**: REAL — 173 lines: `undo`, `toggle`, `finalize`, `counter`, `import_attendance_csv`
- **Views**: REAL — 5 custom actions with `@extend_schema`
- **Tests**: REAL — 20 meaningful tests across 6 classes
- **Permissions**: PARTIAL — ADMIN + SUPERVISOR only, no read/write distinction
- **Serializers**: PARTIAL — 4 serializers, validation in service layer
- **README**: REAL — 59 lines with SRS references

### anonymization

- **Models**: PARTIAL — `AnonymousCode` (denormalized FKs), `ExamCopy` (denormalized user ID)
- **Services**: STUB — placeholder comment
- **Views**: STUB — 2 bare `ModelViewSet`s
- **Tests**: STUB — `PlaceholderTestCase.test_placeholder`
- **Permissions**: PARTIAL — ADMIN-only codes, ADMIN+ANONYMITY_COMMISSION copies
- **Serializers**: STUB — `fields = "__all__"`, no validation
- **README**: None

### correction

- **Models**: REAL — `CorrectionAssignment`, `CopyGrade`, `GradeDiscrepancy`, `SubjectGradeLock`
- **Services**: STUB — placeholder comment
- **Views**: PARTIAL — `CopyGradeViewSet` and `SubjectGradeLockViewSet` restrict HTTP methods
- **Tests**: STUB — `PlaceholderTestCase.test_placeholder`
- **Permissions**: PARTIAL — ADMIN + COORDINATOR + CORRECTOR, no granularity
- **Serializers**: PARTIAL — `CopyGradeSerializer` has grade-lock validation
- **README**: None

### deliberation

- **Models**: REAL — `DeliberationRun`, `DeliberationResult` with outcome enum
- **Services**: STUB — placeholder comment
- **Views**: REAL — `close_deliberation` + `reopen_deliberation` actions with audit logging
- **Tests**: PARTIAL — 3 tests (reopen only)
- **Permissions**: PARTIAL — loose gate at ViewSet level, stricter inline in actions
- **Serializers**: STUB — `fields = "__all__"`, no validation
- **README**: None

### pv

- **Models**: REAL — `PVDocument` (6 types), `PVSignature`
- **Services**: REAL — `generate_attendance_pv()` with content generation + audit
- **Views**: STUB — 2 bare `ModelViewSet`s
- **Tests**: STUB — `PlaceholderTestCase.test_placeholder` (tested indirectly via attendance)
- **Permissions**: PARTIAL — self-described as "skeleton"
- **Serializers**: STUB — nested signatures read-only, no validation
- **README**: None

### audit

- **Models**: REAL — `AuditLog` with ORM-level immutability (ImmutableQuerySet/Manager)
- **Services**: REAL — `log_action()`, `log_event()`
- **Views**: PARTIAL — read-only List+Retrieve, no filtering/export
- **Tests**: PARTIAL — 1 test (log_event derivation)
- **Permissions**: REAL — strict admin-only
- **Serializers**: PARTIAL — all fields read-only
- **README**: None

### notifications

- **Models**: PARTIAL — `NotificationOutbox` with status tracking
- **Services**: STUB — placeholder (real logic in tasks.py)
- **Views**: REAL — `DispatchConvocationsView` with `@extend_schema`, outbox read-only
- **Tests**: REAL — 4 tests (task send, failure, dedup, auth)
- **Permissions**: REAL — strict admin-only
- **Serializers**: STUB — plain ModelSerializer
- **Tasks**: REAL — `send_convocation_email_task` (84 lines, template rendering, outbox pattern)
- **README**: REAL — 31 lines

### integrations

- **Models**: REAL — `CandidateImportBatch` with error_report JSONField
- **Services**: REAL — 243 lines: validation, normalization, duplicate detection, persistence, batch tracking
- **Views**: REAL — 3 views (JSON import, file import, batch read-only)
- **Tests**: REAL — 9 tests covering JSON + file paths
- **Permissions**: REAL — strict admin-only
- **Serializers**: PARTIAL — file import serializer has extension/size validation
- **Parsers**: REAL — `parse_csv()`, `parse_xlsx()`, header validation
- **README**: REAL — 176 lines with examples

### common

- **Models**: REAL — `TimeStampedModel` (abstract, used everywhere)
- **Views**: REAL (trivial) — health check endpoint
- **Everything else**: STUB — placeholder permission, serializer, services
