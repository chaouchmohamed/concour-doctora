# Detailed Attendance Management API Documentation

**Base URL:** `http://127.0.0.1:8000`  
**API Prefix:** `/api/`  
**Authentication:** JWT Bearer token (8-hour lifetime)  
**Last Updated:** 2026-04-28

---

## Overview

The Attendance API manages supervisor marking of candidate presence during exam sessions. The workflow follows this sequence:

1. Load the call list (candidates assigned to a room/schedule)
2. Create an `AttendanceSubmission` for that schedule
3. Mark candidates as PRESENT or ABSENT via individual records
4. Show real-time counts to track progress
5. Finalize the submission (auto-eliminates ABSENT candidates globally, generates PV)

**Key constraint:** Finalization is blocked until every allocated candidate is marked. Once finalized, the submission becomes immutable.

---

## 1. Load Candidate List

### Request

```http
GET /api/examinations/schedules/{id}/call_list/
Authorization: Bearer <access_token>
```

**Parameters:**
- `id` (path, required): The schedule ID. Type: integer.

**Headers:**
- `Authorization: Bearer <access_token>` (required)
- `Content-Type: application/json` (implied)

**Query Parameters:**  
None.

**Request Body:**  
None.

### Response

**Status:** `200 OK`

**Content-Type:** `application/json`

**Body:**
```json
[
  {
    "seat_number": 1,
    "application_number": "DOCT-001",
    "full_name": "Amine Benali",
    "room": "Room A102"
  },
  {
    "seat_number": 2,
    "application_number": "DOCT-002",
    "full_name": "Sarah Mansouri",
    "room": "Room A102"
  },
  {
    "seat_number": 3,
    "application_number": "DOCT-003",
    "full_name": "Karim Zidi",
    "room": "Room A102"
  }
]
```

**Field Descriptions:**
- `seat_number` (integer): Numeric seat assignment (1-based index within the room).
- `application_number` (string): Unique application code (e.g., "DOCT-001").
- `full_name` (string): `{last_name} {first_name}` in that order.
- `room` (string): The exam room name.

**Notes:**
- Results are pre-sorted by `seat_number` ascending.
- The response is a **flat array**, not paginated.
- The list reflects all candidates allocated to the schedule via the `auto_allocate` endpoint.

### Error Responses

**Status:** `404 Not Found`
```json
{
  "detail": "Not found."
}
```
Reason: Schedule does not exist or the authenticated user lacks permission.

**Status:** `403 Forbidden`
```json
{
  "detail": "You do not have permission to perform this action."
}
```
Reason: User role does not have read access to examinations.

---

## 2. Show Live Counts

### Request

```http
GET /api/attendance/submissions/{id}/counter/
Authorization: Bearer <access_token>
```

**Parameters:**
- `id` (path, required): The attendance submission ID. Type: integer.

**Headers:**
- `Authorization: Bearer <access_token>` (required)

**Query Parameters:**  
None.

**Request Body:**  
None.

### Response

**Status:** `200 OK`

**Content-Type:** `application/json`

**Body:**
```json
{
  "submission_id": 12,
  "schedule_id": 8,
  "total_expected": 7,
  "total_marked": 4,
  "total_unmarked": 3,
  "present_count": 3,
  "absent_count": 1,
  "is_finalized": false
}
```

**Field Descriptions:**
- `submission_id` (integer): ID of this attendance submission.
- `schedule_id` (integer): The exam schedule this submission belongs to.
- `total_expected` (integer): The number of candidates allocated to this schedule (immutable).
- `total_marked` (integer): Count of records created for this submission (`PRESENT` + `ABSENT`).
- `total_unmarked` (integer): `total_expected - total_marked`. Count of candidates still pending.
- `present_count` (integer): Count of records with `status="PRESENT"`.
- `absent_count` (integer): Count of records with `status="ABSENT"`.
- `is_finalized` (boolean): Whether the submission has been finalized (`true` = immutable, `false` = editable).

**Notes:**
- Call this endpoint repeatedly to show a real-time progress bar.
- When `total_marked === total_expected`, the supervisor can finalize.
- Once `is_finalized` is `true`, all counts are read-only.

### Error Responses

**Status:** `404 Not Found`
```json
{
  "detail": "Not found."
}
```
Reason: Submission does not exist.

**Status:** `403 Forbidden`
```json
{
  "detail": "You do not have permission to perform this action."
}
```
Reason: User role lacks attendance access (typically requires ADMIN or SUPERVISOR role).

---

## 3. Mark Present/Absent

### Request

```http
POST /api/attendance/records/
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Headers:**
- `Authorization: Bearer <access_token>` (required)
- `Content-Type: application/json` (required)

**Request Body:**
```json
{
  "submission": 12,
  "candidate": 44,
  "status": "PRESENT"
}
```

**Field Descriptions:**
- `submission` (integer, required): The attendance submission ID (links the record to a room/schedule).
- `candidate` (integer, required): The candidate ID being marked.
- `status` (string, required): One of `"PRESENT"` or `"ABSENT"` (case-sensitive, uppercase).

**Constraints:**
- A candidate can only have **one** record per submission. Attempting to create a second record for the same candidate will fail with a `400 Bad Request`.
- The submission must **not** be finalized (`is_finalized === false`).
- The candidate must be allocated to the schedule (checked implicitly via foreign key).

### Response

**Status:** `201 Created`

**Content-Type:** `application/json`

**Body:**
```json
{
  "id": 87,
  "submission": 12,
  "candidate": 44,
  "status": "PRESENT",
  "marked_by": 2,
  "created_at": "2026-04-28T10:32:00Z",
  "updated_at": "2026-04-28T10:32:00Z"
}
```

**Field Descriptions:**
- `id` (integer): The newly created record ID. Use this for toggle/undo operations.
- `submission` (integer): The submission ID (echoes request).
- `candidate` (integer): The candidate ID (echoes request).
- `status` (string): The status (echoes request).
- `marked_by` (integer): The user ID of the supervisor who created this record (auto-populated by the backend).
- `created_at` (string, ISO 8601): Server timestamp.
- `updated_at` (string, ISO 8601): Server timestamp (same as created_at for new records).

### Error Responses

**Status:** `400 Bad Request`
```json
{
  "submission": ["This field may not be null."]
}
```
Reason: Missing required field.

**Status:** `400 Bad Request`
```json
{
  "status": ["\"LATE\" is not a valid choice. Valid choices are \"PRESENT\", \"ABSENT\"."]
}
```
Reason: Invalid status value (must be PRESENT or ABSENT).

**Status:** `400 Bad Request`
```json
{
  "non_field_errors": ["The fields submission, candidate must make a unique set."]
}
```
Reason: A record for this candidate already exists in this submission (use toggle instead).

**Status:** `400 Bad Request`
```json
{
  "detail": "Cannot modify records: the attendance submission is already finalized."
}
```
Reason: Attempted to mark after finalization (submission is immutable).

**Status:** `404 Not Found`
```json
{
  "detail": "Not found."
}
```
Reason: Submission or candidate does not exist.

**Status:** `403 Forbidden`
```json
{
  "detail": "You do not have permission to perform this action."
}
```
Reason: User role lacks attendance write access.

---

## 4. Toggle Present/Absent

### Request

```http
POST /api/attendance/records/{id}/toggle/
Authorization: Bearer <access_token>
```

**Parameters:**
- `id` (path, required): The attendance record ID. Type: integer.

**Headers:**
- `Authorization: Bearer <access_token>` (required)

**Request Body:**  
None (the request body is ignored; toggle is determined by the current status).

### Response

**Status:** `200 OK`

**Content-Type:** `application/json`

**Body:**
```json
{
  "id": 87,
  "submission": 12,
  "candidate": 44,
  "status": "ABSENT",
  "marked_by": 2,
  "created_at": "2026-04-28T10:32:00Z",
  "updated_at": "2026-04-28T10:35:15Z"
}
```

**Behavior:**
- If the record's status was `"PRESENT"`, it becomes `"ABSENT"`.
- If the record's status was `"ABSENT"`, it becomes `"PRESENT"`.
- The `updated_at` timestamp is refreshed.
- The record ID and other fields remain unchanged.

### Error Responses

**Status:** `404 Not Found`
```json
{
  "detail": "Not found."
}
```
Reason: Record does not exist.

**Status:** `400 Bad Request`
```json
{
  "detail": "Cannot toggle: the attendance submission is already finalized."
}
```
Reason: The record's submission has been finalized and is immutable.

**Status:** `403 Forbidden`
```json
{
  "detail": "You do not have permission to perform this action."
}
```
Reason: User role lacks attendance access.

---

## 5. Undo Last Mark

### Request

```http
POST /api/attendance/records/{id}/undo/
Authorization: Bearer <access_token>
```

**Parameters:**
- `id` (path, required): The attendance record ID. Type: integer.

**Headers:**
- `Authorization: Bearer <access_token>` (required)

**Request Body:**  
None.

### Response

**Status:** `204 No Content`

**Body:**  
Empty.

**Behavior:**
- The record is permanently deleted.
- The candidate reverts to unmarked status (can be marked again).
- An audit log entry is created with event `ATTENDANCE_UNDO`.

### Error Responses

**Status:** `404 Not Found`
```json
{
  "detail": "Not found."
}
```
Reason: Record does not exist.

**Status:** `400 Bad Request`
```json
{
  "detail": "Cannot undo: the attendance submission is already finalized."
}
```
Reason: The record's submission has been finalized. Undoing is only allowed before finalization.

**Status:** `403 Forbidden`
```json
{
  "detail": "You do not have permission to perform this action."
}
```
Reason: User role lacks attendance access.

---

## 6. Submit All (Finalize)

### Request

```http
POST /api/attendance/submissions/{id}/finalize/
Authorization: Bearer <access_token>
```

**Parameters:**
- `id` (path, required): The attendance submission ID. Type: integer.

**Headers:**
- `Authorization: Bearer <access_token>` (required)

**Request Body:**  
None.

### Response

**Status:** `200 OK`

**Content-Type:** `application/json`

**Body:**
```json
{
  "submission": {
    "id": 12,
    "exam_schedule": 8,
    "submitted_by": 2,
    "submitted_at": "2026-04-28T11:05:00Z",
    "is_finalized": true,
    "incidents": "",
    "created_at": "2026-04-28T10:30:00Z",
    "updated_at": "2026-04-28T11:05:00Z",
    "records": [
      {
        "id": 87,
        "submission": 12,
        "candidate": 44,
        "status": "PRESENT",
        "marked_by": 2,
        "created_at": "2026-04-28T10:32:00Z",
        "updated_at": "2026-04-28T10:32:00Z"
      }
    ]
  },
  "pv_document_id": 5,
  "pv_document_identifier": "PV-A1B2C3D4E5F6"
}
```

**Field Descriptions:**
- `submission` (object): The finalized attendance submission object.
  - `id` (integer): Submission ID.
  - `exam_schedule` (integer): Schedule ID.
  - `submitted_by` (integer): User ID of the submitting supervisor.
  - `submitted_at` (string, ISO 8601): Finalization timestamp.
  - `is_finalized` (boolean): Always `true` after finalization.
  - `incidents` (string): Any incident notes entered (currently empty, reserved for future use).
  - `created_at` (string, ISO 8601): Submission creation timestamp.
  - `updated_at` (string, ISO 8601): Last update timestamp.
  - `records` (array): All attendance records for this submission (read-only nested array).
- `pv_document_id` (integer): ID of the generated PV of Attendance document.
- `pv_document_identifier` (string): Unique identifier for the PV (e.g., "PV-A1B2C3D4E5F6"). Use this to reference the PV in reports.

**Post-Finalization Effects:**
1. All candidates marked as `ABSENT` are automatically set to `status="ELIMINATED"` globally in the system. They will not appear in correction or deliberation steps.
2. A PV of Attendance document is auto-generated containing:
   - Total present / total absent counts
   - List of absent candidates (application number + full name)
   - Any incidents noted
3. The submission becomes **immutable**: no records can be created, updated, deleted, toggled, or undone.
4. All audit logs are frozen.

### Error Responses

**Status:** `400 Bad Request`
```json
{
  "detail": "Cannot finalize. Only 4 out of 7 expected candidates have been marked."
}
```
Reason: Not all candidates have been marked. The supervisor must mark the remaining 3 before finalizing.

**Status:** `400 Bad Request`
```json
{
  "detail": "This attendance submission is already finalized."
}
```
Reason: Attempted to finalize a submission that is already finalized (idempotent, but blocked).

**Status:** `404 Not Found`
```json
{
  "detail": "Not found."
}
```
Reason: Submission does not exist.

**Status:** `403 Forbidden`
```json
{
  "detail": "You do not have permission to perform this action."
}
```
Reason: User role lacks attendance access.

---
