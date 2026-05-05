# Notifications Module

This module handles communication with candidates and staff, primarily via email. It implements an outbox pattern to ensure auditability and reliability.

## Core Models

- **NotificationOutbox**: Records every notification attempt, its status (`SENT`, `FAILED`, `PENDING`), and the target recipient.

## Workflows

### 1. Convocation Email Dispatch
Generates and sends automated convocations to candidates.

- **Endpoint**: `POST /api/notifications/dispatch-convocations/`
- **Logic**:
  - Filters for candidates in `REGISTERED` status who haven't received a convocation yet.
  - Fetches the active `ExamSession` and all associated `SubjectSchedule` for each candidate.
  - Renders both HTML and Plain Text templates.
  - Queues a Celery task (`send_convocation_email_task`) for asynchronous delivery.
  - Records the attempt in the outbox.

## Templates

Located in `templates/notifications/emails/`:
- `convocation.html`: Rich HTML email.
- `convocation.txt`: Plain text fallback.

## Integration

- **Outbox View**: `GET /api/notifications/outbox/` (Admin only).
- **Batch Dispatch**: Triggered by admins to notify all eligible candidates once the schedule is stabilized.
