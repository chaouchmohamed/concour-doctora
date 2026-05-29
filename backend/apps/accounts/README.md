# Accounts / Authentication Module

Manages user accounts, JWT authentication, invite-based onboarding, RBAC, and account lockout.

## Core Models

- **User**: Custom user model (email-based, no username). Fields: email, role, is_active, failed_login_attempts, locked_until, invited_by.
- **UserInvite**: SHA-256 hashed token, 48h expiry, one-time use.

## Business Rules (SRS CD-FR-AUTH-01 to 05)

1. **JWT Login** (CD-FR-AUTH-01): Access token 8h, refresh token 24h. Token rotation + blacklist after rotation.

2. **Logout Blacklist** (CD-FR-AUTH-02): `POST /api/auth/logout/` blacklists the refresh token, making it unusable.

3. **Account Lockout** (CD-FR-AUTH-03): 3 consecutive failed login attempts → 15min lockout. On lockout, `notify_admin_lockout_task` emails all other active ADMIN users. Successful login clears the counter.

4. **RBAC with 8 Roles** (CD-FR-AUTH-04): ADMIN, CFD_HEAD, COORDINATOR, CORRECTOR, SUPERVISOR, JURY_PRESIDENT, JURY_MEMBER, ANONYMITY_COMMISSION. Each role is enforced per-module via custom `BasePermission` classes.

5. **Invite-Only Onboarding** (CD-FR-AUTH-05): Admin invites a user by email + role. System creates inactive user, generates a SHA-256 hashed invite token, and sends an email with the invite link. User clicks link → sets password → account activated.

## API Endpoints

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/auth/login/` | POST | Public | JWT login (8h access, 24h refresh) |
| `/api/auth/refresh/` | POST | Public | Refresh access token |
| `/api/auth/logout/` | POST | Authenticated | Blacklist refresh token |
| `/api/auth/me/` | GET | Authenticated | Current user profile |
| `/api/auth/invites/` | POST | ADMIN | Invite a new user with a specified role |
| `/api/auth/set-password/` | POST | Public (valid token) | Set password from invite link |
| `/api/auth/users/` | GET/PATCH | ADMIN | List/update user accounts |

## Audit Events

All auth events are logged with IP address capture:
- `USER_LOGIN` — on successful login (ActionType.LOGIN)
- `USER_LOGOUT` — on logout (ActionType.LOGOUT)
- `USER_INVITED` — when admin invites a user (ActionType.CREATE)
- `PASSWORD_SET_FROM_INVITE` — when user activates account (ActionType.UPDATE)
- `ATTENDANCE_FINALIZED` — lockout triggers admin notification email

## Celery Tasks

- `send_invite_email_task(email, invite_link)` — sends invite email via SMTP
- `notify_admin_lockout_task(user_email)` — emails all active admins when a user is locked

## Security

- Passwords hashed with bcrypt (cost 12) via `BCryptSHA256PasswordHasher`
- Invite tokens: 48-byte URL-safe random, SHA-256 hashed before storage
- JWT tokens blacklisted on logout (requires `rest_framework_simplejwt` token blacklist)
- Password minimum length: 12 characters

## Tests

26 tests covering:
- Role choices (all 8 present)
- Login (success, wrong password, nonexistent email, inactive user, audit log)
- Account lockout (3 failures → lock, locked user rejected, successful login clears counters)
- Logout (blacklist, audit log, reuse fails)
- Invite flow (invite with role, duplicate rejected, non-admin rejected, set password activates, expired/used invite rejected, audit logs)
- Me view (authenticated returns user, unauthenticated rejected)
- User management (admin list/update, non-admin denied)
