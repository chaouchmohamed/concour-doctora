# Backend Skeleton Handoff Notes

This backend is intentionally scaffolded, not fully implemented.

## Completed Foundation
- Django project skeleton with split settings (`base/dev/prod/test`)
- DRF + JWT (SimpleJWT) + token blacklist wiring
- Swagger/OpenAPI docs at `/api/docs/`
- Multi-DB setup for nominative + anonymization schemas
- Celery + Redis wiring with placeholder async tasks
- Domain app modules for SRS lifecycle stages
- Invite-only auth skeleton (no public registration endpoint)
- Single-role RBAC enum using exact SRS roles
- Immutable audit log model-level protections (first layer)
- Minimal local run path documented in `BACKEND_RUN_GUIDE.md`:
  - Docker for infra and dependency bootstrap
  - direct Python commands for Django run/migrations

## Important TODOs (next AI)
- Run dependency installation, migrations, and full app startup checks
- Generate migration files (`makemigrations`) for all apps
- Harden anonymization encryption (real AES implementation + key rotation strategy)
- Enforce DB-level grants and cross-service isolation per SRS security constraints
- Implement complete RBAC matrix per endpoint/action
- Implement candidate import validation (CSV/XLSX/API), duplicate handling, reports
- Implement attendance elimination workflow and irreversible submission controls
- Implement correction discrepancy workflow and grade lock enforcement
- Implement deliberation closure service with irreversible lock and anonymity lifting
- Implement PV generation/signature pipelines and archival policies
- Add full audit instrumentation (middleware/signals/services) for all sensitive events
- Add test suites by module and CI pipeline

## Security Notes
- No `/api/auth/register/` endpoint exists.
- Invite flow: admin issues tokenized link -> invited user sets password.
- JWT logout uses refresh token blacklist.
- Audit model blocks update/delete at model/queryset layer, but DB-level immutable controls are still required.
