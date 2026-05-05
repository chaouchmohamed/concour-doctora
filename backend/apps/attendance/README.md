# Attendance Module

This module manages candidate roll-call and attendance finalization during the examination sessions.

## Core Models

- **SubjectSchedule**: The mapping of an exam subject to a specific room, date, and time.
- **ExamAllocation**: Pre-allocation tracking which candidate occupies which seat for a specific subject schedule.
- **AttendanceSubmission**: The container for a roll-call event in a room. Can be "finalized" once.
- **AttendanceRecord**: The specific status (`PRESENT`, `ABSENT`) for a candidate in a submission.

## Business Rules

1. **Exhaustive Marking** (CD-FR-ATT-04/UC-02): A submission cannot be finalized until every candidate allocated to that schedule has been marked.
2. **Status Propagation** (CD-FR-ATT-05): When an attendance submission is finalized, all candidates marked as `ABSENT` are automatically and permanently updated to the `ELIMINATED` status globally. They shall not appear in any further correction or deliberation steps.
3. **Immutable Locking**: Once `is_finalized` is set to `True`:
   - No new `AttendanceRecord` can be created for that submission.
   - No existing `AttendanceRecord` can be updated, deleted, toggled, or undone.
   - The submission itself cannot be finalized again.
4. **Undo Before Finalization** (CD-FR-ATT-03): Before a submission is finalized, any attendance marking can be undone, reverting the candidate to unmarked state.
5. **CSV Fallback Import** (CD-FR-ATT-07): An Administrator can bulk-import attendance data from a CSV file with columns `application_number` and `status`. Already-marked candidates are silently skipped; invalid rows are reported per-row.

## API Endpoints

| Endpoint | Method | SRS Ref | Description |
|---|---|---|---|
| `/api/attendance/submissions/` | CRUD | — | Manage attendance submissions |
| `/api/attendance/submissions/{id}/finalize/` | POST | CD-FR-ATT-05 | Finalize + absent→eliminated + generate PV |
| `/api/attendance/submissions/{id}/counter/` | GET | CD-FR-ATT-04 | Real-time marked/present/absent/unmarked counts |
| `/api/attendance/submissions/{id}/import_csv/` | POST | CD-FR-ATT-07 | Bulk CSV import of attendance records |
| `/api/attendance/records/` | CRUD | — | Manage individual attendance records |
| `/api/attendance/records/{id}/undo/` | POST | CD-FR-ATT-03 | Delete a record (revert to unmarked) |
| `/api/attendance/records/{id}/toggle/` | POST | CD-FR-ATT-03 | Switch PRESENT ↔ ABSENT |

## PV Generation (CD-FR-ATT-06)

On finalization, a **PV of Surveillance** is automatically generated via `apps.pv.services.generate_attendance_pv`. The PV includes:
- Total present / total absent
- List of absentees (application number + full name)
- Any incidents noted by the supervisor

Currently stored as a text file; will be upgraded to PDF once a PDF library is added to requirements.

## Audit

All sensitive actions are logged:
- `ATTENDANCE_FINALIZED` — finalization with eliminated count
- `ATTENDANCE_UNDO` — record deletion with previous status
- `ATTENDANCE_TOGGLE` — status switch with new status
- `ATTENDANCE_CSV_IMPORT` — bulk import with created/skipped/error counts

## Tests

20 tests covering:
- Finalization (success, missing candidates, double-finalize, immutable after finalize, PV generation)
- Undo (before finalize, blocked after finalize)
- Toggle (PRESENT→ABSENT, ABSENT→PRESENT, blocked after finalize)
- Counter (empty, partial, full)
- CSV import (happy path, skip duplicates, invalid status, unknown application number, blocked after finalize, empty file, no file)
