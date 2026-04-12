# Attendance Module

This module manages candidate roll-call and attendance finalization during the examination sessions.

## Core Models

- **SubjectSchedule**: The mapping of an exam subject to a specific room, date, and time.
- **ExamAllocation**: Pre-allocation tracking which candidate occupies which seat for a specific subject schedule.
- **AttendanceSubmission**: The container for a roll-call event in a room. Can be "finalized" once.
- **AttendanceRecord**: The specific status (`PRESENT`, `ABSENT`) for a candidate in a submission.

## Business Rules

1. **Exhaustive Marking**: A submission cannot be finalized until every candidate allocated to that schedule has been marked.
2. **Status Propagation**: When an attendance submission is finalized, all candidates marked as `ABSENT` are automatically updated to the `ELIMINATED` status globally.
3. **Immutable Locking**: Once `is_finalized` is set to `True`:
   - No new `AttendanceRecord` can be created for that submission.
   - No existing `AttendanceRecord` can be updated or deleted.
   - The submission itself cannot be finalized again.

## Integration

- **Trigger Finalization**: `POST /api/attendance/submissions/{id}/finalize/`
- **Audit**: All finalization events are logged in the `AuditLog` including the count of eliminated candidates.
