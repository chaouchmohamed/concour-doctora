# Correction Module

Manages double-blind correction of anonymized exam copies per SRS CD-FR-COR-01 to COR-09.

## Core Models

- **CorrectionAssignment**: Links an `anonymous_code` + `exam_subject_id` to a corrector with an order (FIRST/SECOND/THIRD). Unique on `(anonymous_code, exam_subject_id, order)` and `(anonymous_code, exam_subject_id, corrector)`.
- **CopyGrade**: Records a grade for an anonymous_code by a corrector. Fields: grade (decimal), correction_order, is_final flag. Has grade-lock validation.
- **GradeDiscrepancy**: Tracks when two grades differ beyond the threshold. Fields: difference, is_resolved, resolution_note. Auto-created when both initial grades are entered and |g1-g2| > subject.discrepancy_threshold.
- **SubjectGradeLock**: Per-subject lock that prevents grade entry after coordinator validation. Unique on exam_subject_id. Created via `lock_subject_grades()` which also sets ExamSubject.status to LOCKED.

## Implemented SRS Requirements

| SRS ID | Requirement | Status |
|---|---|---|
| CD-FR-COR-01 | Assign exactly 2 correctors per copy | **BUILT** — `assign_correctors()` + `POST /api/correction/assignments/assign/` |
| CD-FR-COR-02 | Corrector sees only their assigned copies | **BUILT** — Filtered queryset + `GET /api/correction/my-copies/` with scan file URLs |
| CD-FR-COR-03 | Grade entry with score range validation | **BUILT** — `submit_grade()` validates 0 <= grade <= max_score. `POST /api/correction/grades/submit/` |
| CD-FR-COR-04 | Auto-calculate absolute difference | **BUILT** — `_check_for_discrepancy()` runs automatically after each grade submission |
| CD-FR-COR-05 | Discrepancy alert to coordinator | **BUILT** — `GradeDiscrepancy` auto-created + audit logged. Coordinator views via `GET /api/correction/discrepancies/` |
| CD-FR-COR-06 | Third corrector arbitration | **BUILT** — `assign_third_corrector()` + `submit_third_grade()`. Discrepancy auto-resolved on third grade entry. |
| CD-FR-COR-07 | Final grade computation per subject rule | **BUILT** — `compute_final_grades()` supports AVERAGE, MEDIAN, THIRD_CORRECTOR rules. `POST /api/correction/compute-final-grades/` |
| CD-FR-COR-08 | Grade lock after coordinator validation | **BUILT** — `lock_subject_grades()` validates prerequisites (all final grades computed, no unresolved discrepancies). Sets ExamSubject.status=LOCKED. `POST /api/correction/locks/lock-subject/` |
| CD-FR-COR-09 | PV of Correction | **BUILT** — `generate_correction_pv()` creates text PV with all grades, discrepancies, and final grades. Requires grades locked. `POST /api/correction/generate-pv/` |

## API Endpoints

| Endpoint | Method | Access | SRS Ref | Description |
|---|---|---|---|---|
| `/api/correction/assignments/` | GET | ADMIN, COORD, CORRECTOR | COR-01/02 | List assignments (corrector sees own only) |
| `/api/correction/assignments/assign/` | POST | ADMIN, COORDINATOR | COR-01 | Bulk assign 2 correctors per copy (`{subject_id, corrector_ids}`) |
| `/api/correction/assignments/delete-subject/` | DELETE | ADMIN, COORDINATOR | — | Delete all assignments for a subject |
| `/api/correction/my-copies/` | GET | CORRECTOR | COR-02 | Get assigned copies with scan file URLs |
| `/api/correction/grades/` | GET | ADMIN, COORD, CORRECTOR | COR-03 | View grades (corrector sees own only) |
| `/api/correction/grades/submit/` | POST | ADMIN, COORD, CORRECTOR | COR-03 | Submit a grade (auto-detects discrepancy) |
| `/api/correction/discrepancies/` | GET | ADMIN, COORDINATOR | COR-05 | View discrepancies |
| `/api/correction/discrepancies/{id}/assign-third-corrector/` | POST | ADMIN, COORDINATOR | COR-06 | Assign third corrector |
| `/api/correction/compute-final-grades/` | POST | ADMIN, COORDINATOR | COR-07 | Compute final grades per subject rule |
| `/api/correction/locks/` | GET | ADMIN, COORDINATOR | COR-08 | View grade locks |
| `/api/correction/locks/lock-subject/` | POST | ADMIN, COORDINATOR | COR-08 | Lock grades for a subject |
| `/api/correction/generate-pv/` | POST | ADMIN, COORDINATOR | COR-09 | Generate PV of Correction |

## Services

- `assign_correctors(subject_id, corrector_ids, user)` — Bulk assigns exactly 2 correctors per anonymous code
- `get_corrector_assignments(corrector, subject_id=None)` — Returns assignment list for a corrector
- `get_corrector_copies(corrector, subject_id=None)` — Returns ExamCopy records (with file URLs) for assigned copies
- `delete_assignments(subject_id, user)` — Removes all assignments for a subject
- `submit_grade(anonymous_code, exam_subject_id, corrector, grade_value)` — Submit grade with validation (range, assignment, lock, duplicate)
- `assign_third_corrector(discrepancy_id, third_corrector_id, user)` — Assign third corrector to unresolved discrepancy
- `submit_third_grade(anonymous_code, exam_subject_id, corrector, grade_value)` — Submit third grade, auto-resolves discrepancy
- `compute_final_grades(subject_id, user)` — Compute final grades per subject rule (AVERAGE/MEDIAN/THIRD_CORRECTOR), marks is_final
- `lock_subject_grades(subject_id, user)` — Lock subject after validation, sets status=LOCKED
- `generate_correction_pv(subject_id, user)` — Generate PV of Correction (requires lock)

## Permissions

- `CorrectionAccessPermission` — ADMIN + COORDINATOR + CORRECTOR
- `CoordinatorOrAdminPermission` — ADMIN + COORDINATOR only
- `CorrectorOnlyPermission` — CORRECTOR only

## Tests

54 tests across 10 test classes:
- `AssignCorrectorsServiceTests` (7): happy path, 2/3 correctors, validation errors
- `CorrectorAssignmentViewTests` (4): API endpoint, role gates, filtered view
- `CorrectorCopyViewTests` (5): assigned copies with file URLs, subject filter, role gate
- `DeleteAssignmentsTests` (2): delete happy path, blocked when grades exist
- `GradeSubmissionServiceTests` (6): happy path, score range, unassigned, duplicate, lock
- `DiscrepancyDetectionTests` (4): auto-creation, threshold, partial grades, custom threshold
- `GradeSubmissionViewTests` (3): submit endpoint, corrector filtering, admin view
- `ThirdCorrectorTests` (5): assign, submit, resolve, role gates, endpoint
- `FinalGradeComputationTests` (7): AVERAGE, MEDIAN, THIRD_CORRECTOR rules, validation errors, is_final marking
- `GradeLockTests` (5): lock, double-lock, post-lock submission, final grade prerequisite, endpoint
- `CorrectionPVTests` (4): PV generation, lock prerequisite, endpoint, content verification
- `UniqueConstraintTests` (1): same corrector cannot be assigned twice
