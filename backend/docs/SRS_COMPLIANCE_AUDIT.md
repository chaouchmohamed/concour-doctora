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
| CD-FR-COR-01 | Assign 2 correctors per copy | **BUILT** | `assign_correctors()` service + `POST /api/correction/assignments/assign/`. Enforces exactly 2 correctors per copy, round-robin distribution across corrector pairs. |
| CD-FR-COR-02 | Corrector sees only their copies | **BUILT** | `GET /api/correction/assignments/` filtered by requesting corrector. `GET /api/correction/my-copies/` returns copy scan file URLs for assigned copies only (cross-DB safe). |
| CD-FR-COR-03 | Grade entry with score range enforcement | **BUILT** | `submit_grade()` validates 0 <= grade <= ExamSubject.max_score. Also validates: corrector is assigned, subject not locked, no duplicate. `POST /api/correction/grades/submit/` |
| CD-FR-COR-04 | Auto-calculate absolute difference | **BUILT** | `_check_for_discrepancy()` runs automatically after each grade submission. |
| CD-FR-COR-05 | Discrepancy alert to coordinator | **BUILT** | `GradeDiscrepancy` auto-created when difference > threshold. Audit logged. Coordinator views via `GET /api/correction/discrepancies/` |
| CD-FR-COR-06 | Third corrector arbitration | **BUILT** | `assign_third_corrector()` creates THIRD order assignment. `submit_third_grade()` auto-resolves discrepancy. |
| CD-FR-COR-07 | Final grade computation rule | **BUILT** | `compute_final_grades()` supports AVERAGE, MEDIAN, THIRD_CORRECTOR rules. `POST /api/correction/compute-final-grades/` |
| CD-FR-COR-08 | Grade lock after coordinator validation | **BUILT** | `lock_subject_grades()` validates: all final grades computed, no unresolved discrepancies. Sets ExamSubject.status=LOCKED. `POST /api/correction/locks/lock-subject/` |
| CD-FR-COR-09 | PV of Correction | **BUILT** | `generate_correction_pv()` creates text PV with all grades, discrepancies, and final grades. Requires lock. `POST /api/correction/generate-pv/` |

### Electronic Deliberation (CD-FR-DEL-01 to 09)

| SRS ID | Requirement | Status | Detail |
|---|---|---|---|
| CD-FR-DEL-01 | Jury-only access after all subjects validated | **BUILT** | `DeliberationAccessPermission` (ADMIN + JURY_PRESIDENT + JURY_MEMBER). Compute endpoint checks all subjects locked. |
| CD-FR-DEL-02 | Weighted average computation | **BUILT** | `compute_deliberation_results()` computes weighted_average = sum(grade * coeff) / sum(coeff) per code across all subjects. |
| CD-FR-DEL-03 | Provisional ranking (anonymous codes) | **BUILT** | Results ranked by weighted_average DESC. Candidate_id null until close. |
| CD-FR-DEL-04 | Admissibility threshold (ADMITTED/WAITING/REJECTED) | **BUILT** | ADMITTED if >= admission_threshold, WAITING_LIST if rank within admitted_count + waiting_list_capacity, REJECTED otherwise. |
| CD-FR-DEL-05 | Close deliberation (irreversible) | **BUILT** | `close_deliberation()` with prerequisite checks (results exist). Reopen blocked if archived. |
| CD-FR-DEL-06 | Anonymity lifting on closure | **BUILT** | `_lift_anonymity()` decrypts candidate_id from AnonymousCode.candidate_id_encrypted on close. |
| CD-FR-DEL-07 | PV of Deliberation PDF | **BUILT** | `generate_deliberation_pv()` creates text PV with all results + identities. |
| CD-FR-DEL-08 | Electronic signatures on PV | **BUILT** | `sign_pv()` creates PVSignature. Duplicate prevented. ADMIN/JURY_PRESIDENT/JURY_MEMBER can sign. |
| CD-FR-DEL-09 | Archive + immutability after closure | **BUILT** | `archive_deliberation()` sets is_archived=True. Archived runs cannot be reopened. |

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
| **deliberation** | 28 | 280 lines | 9/9 DEL | **Complete** |
| **correction** | 54 | 765 lines | 9/9 COR | **Complete** |
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

- **Models**: REAL — `CorrectionAssignment` (unique_together for order + corrector), `CopyGrade`, `GradeDiscrepancy`, `SubjectGradeLock`
- **Services**: REAL — `assign_correctors()`, `get_corrector_assignments()`, `get_corrector_copies()`, `delete_assignments()`, `submit_grade()`, `assign_third_corrector()`, `submit_third_grade()`, `compute_final_grades()`, `lock_subject_grades()`, `generate_correction_pv()`
- **Views**: REAL — `CorrectionAssignmentViewSet` (assign, delete-subject, filtered list), `CorrectorCopyListView` (my-copies), `CopyGradeViewSet` (submit action, filtered list), `GradeDiscrepancyViewSet` (assign-third-corrector action), `SubjectGradeLockViewSet` (lock-subject action), `ComputeFinalGradesView`, `GenerateCorrectionPVView`
- **Tests**: REAL — 54 tests across 12 classes
- **Permissions**: REAL — `CorrectionAccessPermission`, `CoordinatorOrAdminPermission`, `CorrectorOnlyPermission`
- **Serializers**: REAL — `CorrectionAssignmentCreateSerializer`, `CorrectionAssignmentReadSerializer`, `CorrectorCopySerializer`, `AssignResultSerializer`, `CopyGradeCreateSerializer`, `CopyGradeReadSerializer`, `AssignThirdCorrectorSerializer`, `ComputeFinalGradesSerializer`, `ComputeFinalGradesResultSerializer`, `LockSubjectGradesSerializer`, `GenerateCorrectionPVSerializer`
- **README**: REAL — full SRS status map + endpoint table

### deliberation

- **Models**: REAL — `DeliberationRun` (admission_threshold, waiting_list_capacity, is_archived), `DeliberationResult` (candidate_id populated on close)
- **Services**: REAL — `compute_deliberation_results()`, `close_deliberation()`, `_lift_anonymity()`, `generate_deliberation_pv()`, `sign_pv()`, `archive_deliberation()`
- **Views**: REAL — `DeliberationRunViewSet` (compute, close, reopen, generate-pv, archive actions), `DeliberationResultViewSet` (read-only), `SignDeliberationPVView`
- **Tests**: REAL — 28 tests across 4 classes
- **Permissions**: REAL — `DeliberationAccessPermission`, `JuryPresidentOrAdminPermission`
- **Serializers**: REAL — `DeliberationRunSerializer`, `DeliberationResultSerializer` (with conditional candidate_info), `ComputeDeliberationSerializer`, `SignPVSerializer`
- **README**: REAL — full SRS status map + endpoint table

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
