# Project Status And Next Steps

This document summarizes what has been done, what is missing, and what should be done next.

## 1. What is done

### 1.1 Foundation

- Project structure split by domain apps
- Settings split (`base/dev/prod/test`)
- DRF configured
- SimpleJWT configured
- OpenAPI/Swagger configured
- Multi-DB routing for anonymization app configured

### 1.2 Auth and RBAC skeleton

- Custom `User` model with single role field
- SRS role enum implemented
- Admin-invite flow skeleton implemented
- Invite token set-password endpoint implemented
- Login lockout counters scaffolded
- JWT blacklist logout integrated

### 1.3 Domain skeletons

- Candidates
- Examinations
- Attendance
- Anonymization
- Correction
- Deliberation
- PV
- Audit
- Notifications
- Integrations/import

### 1.4 Security scaffolding

- Password hasher policy aligned to bcrypt
- Immutable audit model protections at application layer
- Role-based permission classes initialized
- Deliberation close action exists
- Deliberation reopen action added as admin-only audited skeleton
- Deliberation reopen endpoint tests added:
  - admin success + audit log creation
  - non-admin denied
  - reason required validation

## 2. What is missing (critical)

- Full RBAC matrix enforcement per endpoint and per action
- Full business workflows for all lifecycle steps
- Real anonymization encryption implementation and key management policy
- Deliberation engine completion (ranking, thresholds, publication)
- Grade discrepancy workflow completion
- Attendance elimination workflow completion
- PV generation/signature pipeline completion
- System-wide audit instrumentation coverage
- Comprehensive test suite

## 3. What is missing (infrastructure/ops)

- CI pipeline (tests, linting, security checks)
- Production deployment profiles
- Backup/restore scripts and procedures
- Monitoring/alerting setup
- Secret management hardening

## 4. Recommended next execution order

1. Finalize RBAC policy matrix and lock endpoint permissions.
2. Complete core workflows in this order:
   candidate import -> attendance -> anonymization -> correction -> deliberation -> PV.
3. Add systematic audit logs to all sensitive state transitions.
4. Implement full test coverage for each workflow.
5. Stabilize API contracts with the frontend team.
6. Prepare production deployment and security hardening pass.

## 5. Current scope warning

This backend is currently a strong skeleton, not a production-complete implementation.
It is suitable for continued iterative development and frontend parallel integration with caution.
