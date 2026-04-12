# Model Handoff Context (Token-Safe Continuity)

Last updated: 2026-04-12  
Project: ConcoursDoctor backend (`backend/`)

This document is for new AI models taking over when context is truncated.
Read this first before coding.

## 0. Dynamic Sections (Must Be Updated Every Slice)

The following sections are not static and must be refreshed after each meaningful code change:

- `## 3. Current Snapshot`
- `## Foundation (already in place)`
- `## Recently completed slice`
- `## 4. What Is Still Missing (High Priority)`
- `## 7. Recommended Next Execution Step`

If these sections are stale, new models can make wrong decisions.
Any model finishing a slice must update these sections before handoff.

## 1. Source of Truth

- Product/spec source of truth: `../SRS-ConcoursDoctor .pdf` (version 1.1.0, 2026-03-29).
- Implementation must follow SRS requirements and IDs.
- If project docs conflict with code, use:
  1. SRS
  2. Current code
  3. Local docs

## 2. Working Style to Keep

- Plan-first, exacting, and minimal changes per slice.
- Teach while building (explain intent, then implementation).
- Do not overbuild.
- Ask user before major design decisions.
- Never assume blank state; inspect current code first.
- For each completed app slice, add/update `apps/<app>/README.md`.

## 3. Current Snapshot

## Foundation (already in place)

- Django + DRF modular app structure.
- JWT auth (SimpleJWT), logout blacklist, invite-only onboarding.
- Swagger/OpenAPI via drf-spectacular.
- MySQL dual-schema setup (default + anonymization) with DB router.
- Celery + Redis wiring.
- Audit log model with app-level immutability guard.

## Versions / runtime

- Django version currently used in venv: `6.0.4`.
- Requirement pinned in `requirements/base.txt`: `Django>=6.0.4,<6.1`.
- Tests status (latest run): `44 passed`.

## Recently completed slice

- **Attendance module fully implemented** (CD-FR-ATT-01 through CD-FR-ATT-07):
  - **CD-FR-ATT-03**: `POST /api/attendance/records/{id}/undo/` — delete record (revert to unmarked); `POST /api/attendance/records/{id}/toggle/` — switch PRESENT ↔ ABSENT. Both blocked after finalization.
  - **CD-FR-ATT-04**: `GET /api/attendance/submissions/{id}/counter/` — real-time counts of total_expected, total_marked, total_unmarked, present_count, absent_count, is_finalized.
  - **CD-FR-ATT-05**: Already in place — absent→eliminated propagation on finalize.
  - **CD-FR-ATT-06**: PV of Surveillance auto-generated on finalization via `apps.pv.services.generate_attendance_pv`. Currently stored as text file; needs PDF library for PDF output.
  - **CD-FR-ATT-07**: `POST /api/attendance/submissions/{id}/import_csv/` — bulk CSV import with per-row validation, duplicate skipping, and error reporting.
- **PV service layer**: `apps/pv/services.py` now has `generate_attendance_pv()` creating a `PVDocument` of type `ATTENDANCE`.
- All actions audited: `ATTENDANCE_FINALIZED`, `ATTENDANCE_UNDO`, `ATTENDANCE_TOGGLE`, `ATTENDANCE_CSV_IMPORT`, `PV_GENERATED`.
- 20 attendance tests (up from 4), 44 total tests passing.
- In-app docs updated: `apps/attendance/README.md`.

## 4. What Is Still Missing (High Priority)

1. ~~Attendance finalization rules~~ — **COMPLETED** in this slice.
2. Anonymization core:
   - CSPRNG code generation format `DOCT-YYYY-XXXX`
   - encrypted identity mapping (AES-256 policy)
   - copy upload and association (CD-FR-ANON-03/04)
   - PV of Anonymization (CD-FR-ANON-05)
3. Correction workflow:
   - discrepancy auto-detection
   - coordinator alert and third-corrector arbitration
   - final-grade computation rule per subject
4. Deliberation engine:
   - weighted averages
   - ranking and thresholds
   - closure prerequisites
   - anonymity lifting on close
5. PV generation for remaining types (Subject Creation, Subject Lottery, Correction, Deliberation). PDF library needed (e.g., reportlab or weasyprint).
6. Full audit coverage for sensitive actions (login/logout, grade changes, identity access, PV generation, config changes).
7. Account lockout notification to Admin (CD-FR-AUTH-03 TODO in User model).

## 5. Mandatory Behavior for Any New Model

Before coding:

1. Read:
   - `docs/MODEL_HANDOFF_CONTEXT.md`
   - relevant app files
2. Run quick checks:
   - `git status -sb`
   - `.venv/bin/python -m django --version`
   - `.venv/bin/python manage.py test --settings=config.settings.test`
3. Confirm current slice scope with user.

During coding:

1. Keep view layer thin; place business logic in services.
2. Add tests for:
   - happy path
   - permission failures
   - validation errors
   - edge-case regressions
3. Do not modify unrelated files.

After coding:

1. Run targeted tests then full test suite.
2. Update app-level `README.md` for changed app.
3. Update this file snapshot section (what changed + next step).

## 6. 5-Minute Project Orientation for New Model

1. Route entrypoint: `config/urls.py`
2. Global settings: `config/settings/base.py`
3. Domain apps: `apps/*`
4. API docs:
   - Swagger UI: `/api/docs/`
   - Schema: `/api/schema/`
5. Current docs:
   - `docs/API_ENDPOINT_CATALOG.md`
   - `docs/API_FRONTEND_INTEGRATION.md`
   - `BACKEND_RUN_GUIDE.md` (root)

## 7. Recommended Next Execution Step

Next implementation slice should be:

1. **Anonymization core** (CD-FR-ANON-01 through CD-FR-ANON-05):
   - CSPRNG code generation in `DOCT-YYYY-XXXX` format
   - Encrypted identity mapping stored in the anonymization schema
   - Copy upload and anonymous code association
   - Identity hiding for correction-phase interfaces
   - PV of Anonymization generation

Rationale:

- Attendance is now complete; anonymization is the next step in the exam lifecycle per the SRS.
- The anonymization app scaffold already exists at `apps/anonymization/`.
- Requires adding a PDF library (e.g., reportlab) to requirements for proper PV output.

## 8. Handoff Prompt Template (for next model)

Use this when passing to another model:

1. Read `docs/MODEL_HANDOFF_CONTEXT.md` first.
2. Treat SRS (`../SRS-ConcoursDoctor .pdf`) as source of truth.
3. Continue from current uncommitted state; do not revert existing edits.
4. Work slice-by-slice, plan first, tests mandatory.
5. After each slice, update `apps/<app>/README.md` and this handoff doc.
