# API Endpoint Catalog (Current Skeleton)

This is the practical endpoint map for frontend integration at the current stage.

## Base

- Base URL: `http://127.0.0.1:8000`
- API prefix: `/api/`
- Auth: `Authorization: Bearer <access_token>`

## Auth module

| Endpoint | Methods | Access | Notes |
|---|---|---|---|
| `/api/auth/login/` | POST | Public | Returns `access` + `refresh` tokens |
| `/api/auth/refresh/` | POST | Public | Refreshes access token |
| `/api/auth/logout/` | POST | Authenticated | Blacklists refresh token |
| `/api/auth/me/` | GET | Authenticated | Returns current user profile |
| `/api/auth/invites/` | POST | ADMIN | Creates invited user and invite token |
| `/api/auth/set-password/` | POST | Public (token-based) | Finalizes invited account |
| `/api/auth/users/` | GET | ADMIN | List users |
| `/api/auth/users/{id}/` | GET, PUT, PATCH | ADMIN | Retrieve/update user |

## Health/docs

| Endpoint | Methods | Access | Notes |
|---|---|---|---|
| `/api/health/` | GET | Public | Healthcheck |
| `/api/docs/` | GET | Public | Swagger UI |
| `/api/schema/` | GET | Public | OpenAPI schema |

## Candidates module

| Endpoint | Methods | Access | Notes |
|---|---|---|---|
| `/api/candidates/` | GET, POST | Read roles + ADMIN write | Read roles: ADMIN, CFD_HEAD, COORDINATOR, SUPERVISOR, JURY_PRESIDENT, JURY_MEMBER |
| `/api/candidates/{id}/` | GET, PUT, PATCH, DELETE | Read roles + ADMIN write | CRUD scaffold |

## Examinations module

| Endpoint | Methods | Access |
|---|---|---|
| `/api/examinations/sessions/` | GET, POST, PUT, PATCH, DELETE | Read roles: ADMIN, CFD_HEAD, COORDINATOR, SUPERVISOR; write: ADMIN |
| `/api/examinations/subjects/` | GET, POST, PUT, PATCH, DELETE | Same as above |
| `/api/examinations/rooms/` | GET, POST, PUT, PATCH, DELETE | Same as above |
| `/api/examinations/schedules/` | GET, POST, PUT, PATCH, DELETE | Same as above |

## Attendance module

| Endpoint | Methods | Access |
|---|---|---|
| `/api/attendance/submissions/` | GET, POST, PUT, PATCH, DELETE | ADMIN, SUPERVISOR |
| `/api/attendance/submissions/{id}/finalize/` | POST | ADMIN, SUPERVISOR |
| `/api/attendance/records/` | GET, POST, PUT, PATCH, DELETE | ADMIN, SUPERVISOR |

## Anonymization module

| Endpoint | Methods | Access | Notes |
|---|---|---|---|
| `/api/anonymization/codes/` | GET, POST, PUT, PATCH, DELETE | ADMIN only | Correspondence mapping boundary |
| `/api/anonymization/copies/` | GET, POST, PUT, PATCH, DELETE | ADMIN, ANONYMITY_COMMISSION | Copy upload/association |

## Correction module

| Endpoint | Methods | Access | Notes |
|---|---|---|---|
| `/api/correction/assignments/` | GET, POST, PUT, PATCH, DELETE | ADMIN, COORDINATOR, CORRECTOR | Assignment scaffold |
| `/api/correction/grades/` | GET, POST | ADMIN, COORDINATOR, CORRECTOR | Grade updates blocked once locked |
| `/api/correction/discrepancies/` | GET, POST, PUT, PATCH, DELETE | ADMIN, COORDINATOR, CORRECTOR | Discrepancy scaffold |
| `/api/correction/locks/` | GET, POST | ADMIN, COORDINATOR, CORRECTOR | Subject grade lock scaffold |

## Deliberation module

| Endpoint | Methods | Access | Notes |
|---|---|---|---|
| `/api/deliberation/runs/` | GET, POST | ADMIN, JURY_PRESIDENT, JURY_MEMBER | Run lifecycle scaffold |
| `/api/deliberation/runs/{id}/` | GET | ADMIN, JURY_PRESIDENT, JURY_MEMBER | Run detail |
| `/api/deliberation/runs/{id}/close/` | POST | ADMIN or JURY_PRESIDENT | Audited action |
| `/api/deliberation/runs/{id}/reopen/` | POST | ADMIN only | Audited. Requires JSON body with non-empty `reason` |
| `/api/deliberation/results/` | GET, POST | ADMIN, JURY_PRESIDENT, JURY_MEMBER | Results scaffold |
| `/api/deliberation/results/{id}/` | GET | ADMIN, JURY_PRESIDENT, JURY_MEMBER | Result detail |

## PV module

| Endpoint | Methods | Access |
|---|---|---|
| `/api/pv/documents/` | GET, POST, PUT, PATCH, DELETE | Read roles: ADMIN, CFD_HEAD, COORDINATOR, SUPERVISOR, JURY_PRESIDENT, JURY_MEMBER, ANONYMITY_COMMISSION; write: ADMIN, CFD_HEAD, COORDINATOR, JURY_PRESIDENT |
| `/api/pv/signatures/` | GET, POST, PUT, PATCH, DELETE | Same as PV documents |

## Audit module

| Endpoint | Methods | Access | Notes |
|---|---|---|---|
| `/api/audit/logs/` | GET | ADMIN only | Read-only log access |
| `/api/audit/logs/{id}/` | GET | ADMIN only | Read-only log detail |

## Notifications module

| Endpoint | Methods | Access |
|---|---|---|
| `/api/notifications/outbox/` | GET | ADMIN only |
| `/api/notifications/outbox/{id}/` | GET | ADMIN only |
| `/api/notifications/dispatch-convocations/` | POST | ADMIN only |

## Integrations/import module

| Endpoint | Methods | Access | Notes |
|---|---|---|---|
| `/api/import/candidates/` | POST | ADMIN only | External/API import entrypoint |
| `/api/import/batches/` | GET | ADMIN only | Batch tracking |
| `/api/import/batches/{id}/` | GET | ADMIN only | Batch detail |

## Deliberation reopen explicit contract

Request:

```http
POST /api/deliberation/runs/{id}/reopen/
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

Body:

```json
{
  "reason": "Administrative override due to data correction"
}
```

Behavior:

- `200 OK`: reopened successfully and audit entry created
- `400 Bad Request`: reason missing or blank
- `403 Forbidden`: caller is not ADMIN
- `409 Conflict`: deliberation already open
