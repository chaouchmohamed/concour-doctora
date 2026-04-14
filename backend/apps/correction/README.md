# Correction Module (Scaffold)

Manages double-blind correction of anonymized exam copies. Currently scaffold-only — models exist but no business logic.

## Core Models

- **CorrectionAssignment**: Links an anonymous_code + exam_subject to a corrector with an order (FIRST/SECOND/THIRD). Unique on (anonymous_code, exam_subject_id, order).
- **CopyGrade**: Records a grade for an anonymous_code by a corrector. Fields: grade (decimal), correction_order, is_final flag. Has grade-lock validation in serializer.
- **GradeDiscrepancy**: Tracks when two grades differ beyond the threshold. Fields: difference, is_resolved, resolution_note.
- **SubjectGradeLock**: Per-subject lock that prevents grade entry after coordinator validation. Unique on exam_subject_id.

## Business Rules (SRS CD-FR-COR-01 to 09) — NOT YET IMPLEMENTED

1. **CD-FR-COR-01**: Assign exactly 2 correctors per copy — no enforcement logic yet.
2. **CD-FR-COR-02**: Corrector sees only their assigned copies — no queryset filtering yet.
3. **CD-FR-COR-03**: Grade entry with score range validation (0 to max_score) — serializer has grade-lock check but no score range.
4. **CD-FR-COR-04**: Auto-calculate absolute difference between two grades — no logic.
5. **CD-FR-COR-05**: Discrepancy alert to coordinator — no trigger.
6. **CD-FR-COR-06**: Third corrector arbitration — no endpoint.
7. **CD-FR-COR-07**: Final grade computation per subject rule (AVERAGE/MEDIAN/THIRD_CORRECTOR) — no service.
8. **CD-FR-COR-08**: Grade lock after coordinator validation — model exists, no "validate all" action.
9. **CD-FR-COR-09**: PV of Correction — no service.

## API Endpoints

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/correction/assignments/` | CRUD | ADMIN, COORD, CORRECTOR | Assign correctors (skeleton) |
| `/api/correction/grades/` | CRUD (no DELETE) | ADMIN, COORD, CORRECTOR | Enter grades (skeleton) |
| `/api/correction/discrepancies/` | GET only | ADMIN, COORD | View discrepancies (skeleton) |
| `/api/correction/grade-locks/` | GET/POST | ADMIN, COORD | View/create grade locks (skeleton) |

## Tests

Placeholder only. Needs full implementation slice.
