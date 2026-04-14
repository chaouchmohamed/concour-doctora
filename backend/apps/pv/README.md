# PV (Procès-Verbal) Module

Generates and stores official PV documents at each stage of the exam lifecycle.

## Core Models

- **PVDocument**: pv_type (6 types), exam_session_id, document_identifier (unique), file, generated_at, generated_by, is_archived
- **PVSignature**: pv_document FK, signer_user FK, signer_name, signed_at
- **PVType**: SUBJECT_CREATION, SUBJECT_LOTTERY, ATTENDANCE, ANONYMIZATION, CORRECTION, DELIBERATION

## Currently Implemented PV Types

| PV Type | Trigger | SRS Ref | Status |
|---|---|---|---|
| SUBJECT_CREATION | CFD Head records subjects submitted | CD-FR-PV-01 | **Working** (text) |
| SUBJECT_LOTTERY | CFD Head records lottery result | CD-FR-EXAM-05 | **Working** (text) |
| ATTENDANCE | Supervisor finalizes attendance | CD-FR-ATT-06 | **Working** (text) |
| ANONYMIZATION | All copies coded for a session | CD-FR-ANON-05 | **Working** (text) |
| CORRECTION | Coordinator locks grades | CD-FR-COR-09 | **Not yet** |
| DELIBERATION | Jury closes deliberation | CD-FR-DEL-07 | **Not yet** |

All PVs currently stored as text files. A PDF library (e.g., reportlab or weasyprint) needs to be added to requirements for proper PDF output.

## Services

- `_generate_document_identifier()`: Creates unique IDs like `PV-XXXXXXXXXXXX`
- `generate_attendance_pv(submission, user)`: Called from attendance finalization
- `generate_anonymization_pv(session_id, user)`: Called from anonymization complete endpoint

## API Endpoints

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/pv/documents/` | GET | ADMIN, CFD_HEAD | List PV documents |
| `/api/pv/documents/{id}/` | GET | ADMIN, CFD_HEAD | Retrieve PV document |
| `/api/pv/signatures/` | GET/POST | ADMIN | View/create signatures |

## Tests

Placeholder only. PVs are tested indirectly via attendance and anonymization test suites.
