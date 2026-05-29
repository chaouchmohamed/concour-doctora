# Model Handoff Context (Token-Safe Continuity)

Last updated: 2026-04-15  
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
- Tests status (latest run): `173 passed`.

## Recently completed slice

- **Deliberation engine fully implemented** (CD-FR-DEL-01 through DEL-09):
  - **CD-FR-DEL-01**: Jury-only access with prerequisite check (all subjects locked before compute).
  - **CD-FR-DEL-02**: Weighted average computation: `sum(grade * coefficient) / sum(coefficients)` per anonymous code across all subjects.
  - **CD-FR-DEL-03**: Provisional ranking by weighted_average DESC (anonymous codes only until close).
  - **CD-FR-DEL-04**: Admissibility auto-flagging: ADMITTED if >= admission_threshold, WAITING_LIST if rank within capacity, REJECTED otherwise. Threshold + capacity configurable on DeliberationRun.
  - **CD-FR-DEL-05**: Close deliberation with prerequisite checks. Reopen blocked if archived.
  - **CD-FR-DEL-06**: Anonymity lifting on close: `_lift_anonymity()` decrypts candidate_id from Fernet-encrypted AnonymousCode.candidate_id_encrypted and populates DeliberationResult.candidate_id.
  - **CD-FR-DEL-07**: PV of Deliberation generated as text file with all results + identities.
  - **CD-FR-DEL-08**: Electronic signatures via `sign_pv()`. ADMIN/JURY_PRESIDENT/JURY_MEMBER can sign. Duplicate prevented.
  - **CD-FR-DEL-09**: Archival: sets is_archived=True on run + PV. Archived deliberations cannot be reopened.
  - `DeliberationRun` model: added `admission_threshold`, `waiting_list_capacity`, `is_archived`.
  - 28 deliberation tests (was 3). 173 total tests passing.

## 4. What Is Still Missing (High Priority)

1. ~~Attendance finalization rules~~ — **COMPLETED**.
2. ~~Anonymization core~~ — **COMPLETED**.
3. ~~Examination Planning~~ — **COMPLETED**.
4. ~~Correction workflow (COR-01 through COR-09)~~ — **COMPLETED**.
5. ~~Deliberation engine (DEL-01 through DEL-09)~~ — **COMPLETED**.
6. PV generation: all 6 PV types now implemented (text format). PDF library still needed for production (reportlab/weasyprint).
7. ~~Full audit coverage for auth events~~ — **COMPLETED**.
8. ~~Account lockout notification to Admin~~ — **COMPLETED**.
9. Candidate deactivate (CD-FR-CAND-05): No deactivate endpoint yet.
10. Object-level RBAC refinement: corrector-specific queryset filtering already done; other modules may need tightening.

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

1. **Candidate deactivate** (CD-FR-CAND-05): Add deactivate/activate endpoint on candidates module. Currently bare CRUD only.

Rationale: The exam lifecycle is now complete (Import → Plan → Attendance → Anonymize → Correct → Deliberate → PV). The remaining items are polish/debt items.

## 8. Handoff Prompt Template (for next model)

Use this when passing to another model:

1. Read `docs/MODEL_HANDOFF_CONTEXT.md` first.
2. Treat SRS (`../SRS-ConcoursDoctor .pdf`) as source of truth.
3. Continue from current uncommitted state; do not revert existing edits.
4. Work slice-by-slice, plan first, tests mandatory.
5. After each slice, update `apps/<app>/README.md` and this handoff doc.
