# Model Handoff Context (Token-Safe Continuity)

Last updated: 2026-04-10  
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
- Tests status (latest run): `17 passed`.

## Recently completed slice

- `POST /api/import/candidates/` and `POST /api/import/candidates/file/` are now real:
  - row validation
  - duplicate checks (payload + DB)
  - partial import support
  - detailed per-row error report
  - batch status: `COMPLETED | COMPLETED_WITH_ERRORS | FAILED`
  - file route accepts `.csv` and `.xlsx` via `openpyxl`
- **Convocation Email Workflow:**
  - Dynamic scheduling templating (via `send_convocation_email_task`)
  - Integration with `NotificationOutbox`
  - Re-entrant dispatch endpoint (`POST /api/notifications/dispatch-convocations/`)
- In-app doc updated: `apps/integrations/README.md`.
- Tests added in `apps/integrations/tests.py` and `apps/notifications/tests.py`.

## 4. What Is Still Missing (High Priority)

1. Attendance finalization rules:
   - all candidates marked before submit
   - undo before submit
   - absent -> eliminated propagation
2. Anonymization core:
   - CSPRNG code generation format `DOCT-YYYY-XXXX`
   - encrypted identity mapping (AES-256 policy)
3. Correction workflow:
   - discrepancy auto-detection
   - coordinator alert and third-corrector arbitration
   - final-grade computation rule per subject
4. Deliberation engine:
   - weighted averages
   - ranking and thresholds
   - closure prerequisites
   - anonymity lifting on close
5. PV generation/signature/archive workflows.
6. Full audit coverage for sensitive actions (login/logout, grade changes, identity access, PV generation, config changes).

## 5. Mandatory Behavior for Any New Model

Before coding:

1. Read:
   - `docs/MODEL_HANDOFF_CONTEXT.md`
   - `docs/PROJECT_STATUS_AND_NEXT_STEPS.md`
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

1. Attendance finalization rules:
   - Ensuring all present/absent states are marked before allowing submission.
   - Enforcing "Absent" propagation to "Eliminated" candidate status.
   - Auditing the finalization.

Rationale:

- Core requirement before Anonymization and Correction can mathematically proceed (must know the exact pool height).
- Builds on existing attendance snapshot.

## 8. Handoff Prompt Template (for next model)

Use this when passing to another model:

1. Read `docs/MODEL_HANDOFF_CONTEXT.md` first.
2. Treat SRS (`../SRS-ConcoursDoctor .pdf`) as source of truth.
3. Continue from current uncommitted state; do not revert existing edits.
4. Work slice-by-slice, plan first, tests mandatory.
5. After each slice, update `apps/<app>/README.md` and this handoff doc.
