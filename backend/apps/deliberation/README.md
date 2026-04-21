# Deliberation Module

Manages electronic deliberation of doctoral exam results per SRS CD-FR-DEL-01 to DEL-09.

## Core Models

- **DeliberationRun**: Per-session deliberation record. Fields: exam_session_id (unique), status (OPEN/CLOSED), admission_threshold (default 10.00), waiting_list_capacity (default 0), is_archived, closed_at, closed_by.
- **DeliberationResult**: Per-candidate result. Fields: deliberation (FK), candidate_id (populated on close after anonymity lift), anonymous_code, weighted_average, rank, outcome (ADMITTED/WAITING_LIST/REJECTED).

## Implemented SRS Requirements

| SRS ID | Requirement | Status |
|---|---|---|
| CD-FR-DEL-01 | Jury-only access after all subjects validated | **BUILT** — `DeliberationAccessPermission` (ADMIN + JURY_PRESIDENT + JURY_MEMBER). Compute endpoint checks all subjects locked. |
| CD-FR-DEL-02 | Weighted average computation | **BUILT** — `compute_deliberation_results()` computes weighted_average = sum(grade * coeff) / sum(coeff) per code across all subjects. |
| CD-FR-DEL-03 | Provisional ranking (anonymous codes) | **BUILT** — Results ranked by weighted_average DESC. Ranked before close; candidate_id null until close. |
| CD-FR-DEL-04 | Admissibility threshold | **BUILT** — ADMITTED if >= threshold, WAITING_LIST if rank within admitted_count + waiting_list_capacity, REJECTED otherwise. |
| CD-FR-DEL-05 | Close deliberation (irreversible) | **BUILT** — `close_deliberation()` with prerequisite checks. Sets CLOSED + closed_at + closed_by. |
| CD-FR-DEL-06 | Anonymity lifting on closure | **BUILT** — `_lift_anonymity()` decrypts candidate_id from AnonymousCode.candidate_id_encrypted and populates DeliberationResult.candidate_id. |
| CD-FR-DEL-07 | PV of Deliberation | **BUILT** — `generate_deliberation_pv()` creates text PV with all results + identities (if closed). |
| CD-FR-DEL-08 | Electronic signatures on PV | **BUILT** — `sign_pv()` creates PVSignature. ADMIN/JURY_PRESIDENT/JURY_MEMBER can sign. Duplicate sign prevented. |
| CD-FR-DEL-09 | Archive + immutability after closure | **BUILT** — `archive_deliberation()` sets is_archived=True on run + PV. Archived deliberations cannot be reopened. |

## API Endpoints

| Endpoint | Method | Access | SRS Ref | Description |
|---|---|---|---|---|
| `/api/deliberation/runs/` | GET, POST | ADMIN, JURY_PRES, JURY_MEM | DEL-01 | Manage deliberation runs |
| `/api/deliberation/runs/{id}/` | GET | ADMIN, JURY_PRES, JURY_MEM | — | Run detail |
| `/api/deliberation/runs/{id}/compute/` | POST | ADMIN, JURY_PRESIDENT | DEL-02/03/04 | Compute weighted averages, ranking, outcomes |
| `/api/deliberation/runs/{id}/close/` | POST | ADMIN, JURY_PRESIDENT | DEL-05/06 | Close deliberation + lift anonymity |
| `/api/deliberation/runs/{id}/reopen/` | POST | ADMIN only | DEL-05 | Reopen (requires reason, blocked if archived) |
| `/api/deliberation/runs/{id}/generate-pv/` | POST | ADMIN, JURY_PRESIDENT | DEL-07 | Generate PV of Deliberation |
| `/api/deliberation/runs/{id}/archive/` | POST | ADMIN, JURY_PRESIDENT | DEL-09 | Archive deliberation (immutable) |
| `/api/deliberation/results/` | GET | ADMIN, JURY_PRES, JURY_MEM | DEL-03 | View results (ranked) |
| `/api/deliberation/sign-pv/` | POST | ADMIN, JURY_PRES, JURY_MEM | DEL-08 | Sign a deliberation PV `{pv_document_id}` |

## Services

- `compute_deliberation_results(session_id, user)` — Computes weighted averages, ranks, and outcomes for all copies in a session. Validates all subjects locked.
- `close_deliberation(deliberation_id, user)` — Closes with prerequisite checks, triggers anonymity lifting.
- `_lift_anonymity(deliberation)` — Decrypts candidate IDs and populates DeliberationResult.candidate_id.
- `generate_deliberation_pv(deliberation_id, user)` — Generates text PV after close.
- `sign_pv(pv_document_id, signer_user)` — Creates PVSignature. Prevents duplicate signing.
- `archive_deliberation(deliberation_id, user)` — Marks deliberation + PV as archived/immutable.

## Permissions

- `DeliberationAccessPermission` — ADMIN + JURY_PRESIDENT + JURY_MEMBER
- `JuryPresidentOrAdminPermission` — ADMIN + JURY_PRESIDENT only (compute, close, archive, generate PV)

## Tests

28 tests across 4 classes:
- `ComputeDeliberationTests` (10): weighted average, ranking, outcomes, validation, endpoint
- `CloseAndLiftAnonymityTests` (6): close, anonymity lifting, double close, reopen blocked if archived
- `DeliberationPVTests` (4): PV generation, content, close prerequisite, endpoint
- `SignAndArchiveTests` (8): sign PV, duplicate sign, non-jury rejection, archive, double archive, endpoint
