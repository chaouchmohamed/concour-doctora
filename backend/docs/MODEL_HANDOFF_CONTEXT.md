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
- Tests status (latest run): `95 passed`.

## Recently completed slice

- **Accounts/Auth module fully implemented** (CD-FR-AUTH-01 through AUTH-05 + CD-FR-LOG-02/03):
  - **CD-FR-AUTH-01**: JWT login with 8h access / 24h refresh, token rotation + blacklist. Working.
  - **CD-FR-AUTH-02**: Logout blacklists refresh token. Working.
  - **CD-FR-AUTH-03**: 3 failed logins → 15min lockout. `notify_admin_lockout_task` now **implemented** (emails all active ADMIN users).
  - **CD-FR-AUTH-04**: 8 RBAC roles enforced per-module.
  - **CD-FR-AUTH-05**: Invite-only onboarding: Admin invites user (email + role) → email with invite link → user sets password → account activated. `send_invite_email_task` now **implemented** (sends real SMTP email).
  - **CD-FR-LOG-02**: Login/logout events now logged with IP address capture (`X-Forwarded-For` aware).
  - **CD-FR-LOG-03**: Added `ActionType.LOGIN` and `ActionType.LOGOUT` to audit choices.
  - **`log_event()`** now accepts optional `ip_address` parameter.
  - 26 accounts tests (was 1), 95 total tests passing.
  - In-app docs: `apps/accounts/README.md`.

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
6. ~~Full audit coverage for auth events~~ — **COMPLETED** (login/logout + IP capture).
7. Account lockout notification to Admin — **COMPLETED** (`notify_admin_lockout_task`).

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
