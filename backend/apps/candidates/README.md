# Candidates Module

Stores candidate records imported from external systems. Currently scaffold-only for CRUD operations.

## Core Models

- **Candidate**: national_id, first_name, last_name, email, phone, application_number, status (REGISTERED/ELIMINATED)
- **CandidateStatus**: REGISTERED, ELIMINATED

## Business Rules (SRS CD-FR-CAND-05)

1. **Manual add/edit/deactivate** (CD-FR-CAND-05): Currently a bare `ModelViewSet` — no deactivate logic, no edit restrictions, no validation beyond model fields. **Not yet implemented.**

## Current Status

- **Import**: Handled by `apps/integrations/` (CD-FR-CAND-01 to 03) — fully working.
- **CRUD**: Skeleton only. Needs: deactivate endpoint, edit restrictions (ADMIN-only), validation.
- **Status propagation**: Candidates are set to ELIMINATED by `apps/attendance/services.py` when marked ABSENT on finalization.

## API Endpoints

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/candidates/candidates/` | CRUD | ADMIN write, 4 roles read | Basic CRUD (skeleton) |

## Tests

Placeholder only. Real candidate import tests are in `apps/integrations/tests.py`.
