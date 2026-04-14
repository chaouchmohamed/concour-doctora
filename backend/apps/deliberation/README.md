# Deliberation Module (Partial)

Manages jury deliberation for exam sessions. Partially implemented — close/reopen actions exist but the core computation engine is missing.

## Core Models

- **DeliberationRun**: Per-session deliberation record. Status (OPEN/CLOSED), closed_at, closed_by.
- **DeliberationResult**: Per-candidate result in a deliberation. Fields: candidate_id, anonymous_code, weighted_average, rank, outcome (ADMITTED/WAITING_LIST/REJECTED). Unique on (deliberation, rank).
- **DeliberationOutcome**: ADMITTED, WAITING_LIST, REJECTED.

## Business Rules (SRS CD-FR-DEL-01 to 09) — PARTIALLY IMPLEMENTED

| SRS ID | Requirement | Status |
|---|---|---|
| CD-FR-DEL-01 | Jury-only access after all subjects validated | **PARTIAL** — role gate exists, no prerequisite check |
| CD-FR-DEL-02 | Weighted average computation | **MISSING** |
| CD-FR-DEL-03 | Provisional ranking (anonymous codes) | **MISSING** |
| CD-FR-DEL-04 | Admissibility threshold auto-flagging | **MISSING** |
| CD-FR-DEL-05 | Close deliberation (irreversible) | **PARTIAL** — close/reopen actions exist with audit |
| CD-FR-DEL-06 | Anonymity lifting on closure | **MISSING** |
| CD-FR-DEL-07 | PV of Deliberation | **MISSING** |
| CD-FR-DEL-08 | Electronic signatures on PV | **MISSING** — PVSignature model exists |
| CD-FR-DEL-09 | Archive + immutability after closure | **MISSING** |

## API Endpoints

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/deliberation/runs/` | CRUD | JURY_PRES, JURY_MEM, ADMIN | Manage deliberation runs |
| `/api/deliberation/runs/{id}/close/` | POST | JURY_PRES, ADMIN | Close deliberation |
| `/api/deliberation/runs/{id}/reopen/` | POST | ADMIN | Reopen (with reason) |
| `/api/deliberation/results/` | GET | JURY_PRES, JURY_MEM, ADMIN | View results |

## Tests

3 tests covering: admin reopen, non-admin reopen rejected, reopen requires reason.
