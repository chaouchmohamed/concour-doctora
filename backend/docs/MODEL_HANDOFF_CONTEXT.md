# Model Handoff Context (Token-Safe Continuity)

Last updated: 2026-04-13  
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
- Tests status (latest run): `70 passed`.

## Recently completed slice

- **Examination Planning module fully implemented** (CD-FR-EXAM-01 through EXAM-05 + PV of Subject Creation):
  - **CD-FR-EXAM-01**: Subject creation with validation (coefficient > 0, pass_threshold <= max_score, discrepancy_threshold >= 0)
  - **CD-FR-EXAM-02**: `POST /api/examinations/schedules/{id}/auto_allocate/` — randomly distributes candidates across rooms. `per_room = ceil(total/rooms)`. Re-run reshuffles.
  - **CD-FR-EXAM-03**: Per-room call list via `GET .../schedules/{id}/call_list/` + consolidated per-subject via `GET .../subjects/{id}/call_list/`
  - **CD-FR-EXAM-04**: Supervisors can read call lists digitally (CallListAccessPermission)
  - **CD-FR-EXAM-05**: `POST /api/examinations/sessions/{id}/lottery/` — CFD Head records lottery result + generates PV of Subject Lottery. Sets `lottery_subject` FK on ExamSession.
  - **PV of Subject Creation**: `POST /api/examinations/sessions/{id}/record_subjects/` — CFD Head records subjects submitted + generates PV.
  - Added `lottery_subject` FK to ExamSession model (migration 0002).
  - Added `ExamAllocationViewSet` (read-only) to urls.
  - 14 examinations tests, 70 total tests passing.
  - In-app docs: `apps/examinations/README.md`.

## 4. What Is Still Missing (High Priority)

1. ~~Attendance finalization rules~~ — **COMPLETED**.
2. ~~Anonymization core~~ — **COMPLETED**.
3. ~~Examination Planning~~ — **COMPLETED** in this slice.
4. Correction workflow:
   - discrepancy auto-detection
   - coordinator alert and third-corrector arbitration
   - final-grade computation rule per subject
4. Deliberation engine:
   - weighted averages
   - ranking and thresholds
   - closure prerequisites
   - anonymity lifting on close
5. PV generation for remaining types (Correction, Deliberation). PDF library needed (e.g., reportlab or weasyprint). Subject Creation and Lottery PVs now done (text format).
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

1. **Correction workflow** (CD-FR-COR-01 through COR-09):
   - Assign anonymized copies to 2 correctors (CD-FR-COR-01)
   - Grade entry with score range validation (CD-FR-COR-03)
   - Discrepancy auto-detection when both grades entered (CD-FR-COR-04/05)
   - Third corrector arbitration (CD-FR-COR-06)
   - Final grade computation per subject rule (CD-FR-COR-07)
   - Grade lock after coordinator validation (CD-FR-COR-08)
   - PV of Correction (CD-FR-COR-09)

Rationale:

- Examination Planning is complete; Correction is the next step in the exam lifecycle.
- The `CorrectionAssignment`, `CopyGrade`, `GradeDiscrepancy`, `SubjectGradeLock` models already exist.

## 8. Handoff Prompt Template (for next model)

Use this when passing to another model:

1. Read `docs/MODEL_HANDOFF_CONTEXT.md` first.
2. Treat SRS (`../SRS-ConcoursDoctor .pdf`) as source of truth.
3. Continue from current uncommitted state; do not revert existing edits.
4. Work slice-by-slice, plan first, tests mandatory.
5. After each slice, update `apps/<app>/README.md` and this handoff doc.
