# Examination Planning Module

Manages exam sessions, subjects, rooms, scheduling, candidate allocation, call lists, and the subject lottery process.

## Core Models

- **ExamSession**: Name, year, status (DRAFT/ACTIVE/CLOSED), `lottery_subject` FK (nullable, set after lottery)
- **ExamSubject**: Name, coefficient, max_score, pass_threshold, discrepancy_threshold, final_grade_rule, status (DRAFT/ACTIVE/LOCKED)
- **ExamRoom**: Name, capacity (informational, not enforced)
- **SubjectSchedule**: Subject + room + date + time + duration. Unique constraint on (subject, room, date, time).
- **ExamAllocation**: Candidate + schedule + seat_number. Unique on (schedule, candidate) and (schedule, seat_number).

## Business Rules (SRS CD-FR-EXAM-01 to 05)

1. **Subject Definition** (CD-FR-EXAM-01): Admin defines subjects with validation: coefficient > 0, pass_threshold <= max_score, discrepancy_threshold >= 0.

2. **Scheduling + Auto-Allocation** (CD-FR-EXAM-02): Admin schedules subjects to rooms. Then triggers `auto_allocate` which randomly distributes all REGISTERED candidates across rooms for that subject. Distribution: `per_room = ceil(total / rooms)`. Re-running reshuffles all allocations for the subject.

3. **Call List** (CD-FR-EXAM-03): Per-room call list listing candidates sorted by seat_number with application_number + full_name. Also a consolidated per-subject call list across all rooms.

4. **Digital Access** (CD-FR-EXAM-04): Supervisors and CFD Heads can read call lists digitally via the API.

5. **Subject Lottery** (CD-FR-EXAM-05): CFD Head records which subject was selected by lottery. Sets `lottery_subject` on ExamSession + generates PV of Subject Lottery.

6. **PV of Subject Creation** (CD-FR-PV-01): CFD Head records that subjects have been submitted. Generates PV listing all subjects with their parameters.

## API Endpoints

| Endpoint | Method | SRS Ref | Access | Description |
|---|---|---|---|---|
| `/api/examinations/sessions/` | CRUD | — | ADMIN write, 4 roles read | Manage exam sessions |
| `/api/examinations/subjects/` | CRUD | EXAM-01 | ADMIN write, 4 roles read | Manage subjects |
| `/api/examinations/rooms/` | CRUD | — | ADMIN write, 4 roles read | Manage rooms |
| `/api/examinations/schedules/` | CRUD | EXAM-02 | ADMIN write, 4 roles read | Manage schedules |
| `/api/examinations/allocations/` | GET | — | 4 roles read | View allocations |
| `/api/examinations/schedules/{id}/auto_allocate/` | POST | EXAM-02 | ADMIN | Random candidate allocation |
| `/api/examinations/schedules/{id}/call_list/` | GET | EXAM-03/04 | ADMIN, CFD_HEAD, COORD, SUPER | Per-room call list |
| `/api/examinations/subjects/{id}/call_list/` | GET | EXAM-03/04 | ADMIN, CFD_HEAD, COORD, SUPER | Consolidated call list |
| `/api/examinations/sessions/{id}/record_subjects/` | POST | PV-01 | ADMIN, CFD_HEAD | Record subjects + PV |
| `/api/examinations/sessions/{id}/lottery/` | POST | EXAM-05 | ADMIN, CFD_HEAD | Record lottery + PV |

## Validation Rules

- `ExamSubject.coefficient` > 0
- `ExamSubject.pass_threshold` <= `max_score`
- `ExamSubject.discrepancy_threshold` >= 0
- `ExamRoom.capacity` >= 0
- `SubjectSchedule.duration_minutes` > 0
- Lottery subject must belong to the same session

## Audit Events

- `CANDIDATES_AUTO_ALLOCATED` — with count and rooms used
- `PV_GENERATED` (SUBJECT_CREATION / SUBJECT_LOTTERY)
- `LOTTERY_RESULT_RECORDED` — with selected subject

## Tests

14 tests covering:
- Subject validation (coefficient, threshold, discrepancy)
- Auto-allocation (distribution across rooms, reshuffle on rerun)
- Call lists (per-room, consolidated, supervisor access, corrector denied)
- Lottery (CFD Head records, non-CFD denied, cross-session rejected)
- PV of Subject Creation (success, empty session rejected)
