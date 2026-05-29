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

## 7. CSV Fallback Import

### Request

```http
POST /api/attendance/submissions/{id}/import_csv/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Parameters:**
- `id` (path, required): The attendance submission ID. Type: integer.

**Headers:**
- `Authorization: Bearer <access_token>` (required)
- `Content-Type: multipart/form-data` (required, auto-set by form submission)

**Form Data:**
- `file` (form field, required): A CSV file with UTF-8 encoding.

**CSV Format:**

The file must have a header row with two columns: `application_number` and `status`.

Example file content:
```csv
application_number,status
DOCT-001,PRESENT
DOCT-002,ABSENT
DOCT-003,PRESENT
```

**Constraints:**
- Column names are case-sensitive and must be exactly `application_number` and `status`.
- Status values must be exactly `PRESENT` or `ABSENT` (case-insensitive in parsing, but uppercased).
- Rows with missing or invalid data are reported but do not block the entire import.
- Candidates already marked in the submission are silently skipped (no error).
- The file must be encoded in UTF-8.
- The submission must **not** be finalized.

### Response

**Status:** `200 OK`

**Content-Type:** `application/json`

**Body:**
```json
{
  "created": 3,
  "skipped_duplicates": 1,
  "errors": [
    {
      "row": 4,
      "message": "Invalid status 'LATE'. Must be PRESENT or ABSENT."
    },
    {
      "row": 5,
      "message": "No allocation found for application_number 'DOCT-999' in this schedule."
    }
  ]
}
```

**Field Descriptions:**
- `created` (integer): Number of new records successfully created.
- `skipped_duplicates` (integer): Number of rows skipped because the candidate already has a record in this submission.
- `errors` (array): List of validation errors encountered (does not block import).
  - `row` (integer): CSV row number (1-indexed, starting after header).
  - `message` (string): Description of the error.

**Notes:**
- Successful rows are committed; erroneous rows are reported but do not roll back the transaction.
- If some rows fail, the response still shows `200 OK` (not a complete failure), but indicates which rows had issues.
- An audit log entry is created with event `ATTENDANCE_CSV_IMPORT` and counts.

### Error Responses

**Status:** `400 Bad Request`
```json
{
  "detail": "No file provided."
}
```
Reason: The `file` form field is missing.

**Status:** `400 Bad Request`
```json
{
  "detail": "File must be UTF-8 encoded CSV."
}
```
Reason: The file could not be decoded as UTF-8.

**Status:** `400 Bad Request`
```json
{
  "detail": "CSV file is empty."
}
```
Reason: The CSV file has no data rows (only a header or completely empty).

**Status:** `400 Bad Request`
```json
{
  "detail": "Cannot import into a finalized attendance submission."
}
```
Reason: The submission has already been finalized and is immutable.

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
Reason: User role lacks attendance write access (typically ADMIN or SUPERVISOR).

---

## Common Patterns & Workflow

### Full Supervisor Marking Flow

```
1. GET /api/examinations/schedules/{schedule_id}/call_list/
   → Fetch the list of candidates assigned to the room.

2. POST /api/attendance/submissions/
   → Create a new submission for this schedule (via the CRUD endpoint).
   Payload: { "exam_schedule": {schedule_id} }

3. For each candidate:
   POST /api/attendance/records/
   Payload: { "submission": {submission_id}, "candidate": {candidate_id}, "status": "PRESENT" or "ABSENT" }

4. Poll progress:
   GET /api/attendance/submissions/{submission_id}/counter/
   → Show live counts on the UI.

5. Modify as needed:
   POST /api/attendance/records/{record_id}/toggle/     (to switch status)
   POST /api/attendance/records/{record_id}/undo/       (to revert a mark)

6. When all candidates are marked (total_marked === total_expected):
   POST /api/attendance/submissions/{submission_id}/finalize/
   → Lock the submission, eliminate absent candidates, generate PV.
```

### Offline Sync (PWA)

1. Store records in browser localStorage.
2. Periodically retry POST /api/attendance/records/ in the background.
3. On connectivity restore, also retry the finalize endpoint.
4. Show a "SYNCED" or "PENDING" badge based on the last successful request.

### CSV Fallback

1. If real-time marking fails, the administrator can prepare a CSV file with candidate app numbers and statuses.
2. POST /api/attendance/submissions/{submission_id}/import_csv/ with the file.
3. The response shows created, skipped, and error rows.
4. Manually address any reported errors (e.g., unknown application numbers).

---

## Authentication & Authorization

All endpoints require a valid JWT access token.

**Role Requirements:**
- **SUPERVISOR**: Can mark attendance, toggle, undo, finalize, and import CSV for their assigned schedule.
- **ADMIN**: Full access to all attendance operations across all schedules.
- **Other roles**: No access; will receive `403 Forbidden`.

**Token Format:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Refresh:**
- Access tokens expire after 8 hours.
- Use the refresh token to obtain a new access token from `POST /api/auth/refresh/`.

---

## Constraints & Business Rules

1. **Exhaustive Marking** (CD-FR-ATT-04): A submission cannot be finalized until every allocated candidate has been marked.
2. **One Record per Candidate**: Each candidate can only have one record per submission. Attempting a second POST for the same candidate will fail with `400 Bad Request`.
3. **Immutable After Finalization**: Once `is_finalized=true`, no record can be created, updated, toggled, or undone.
4. **Automatic Elimination** (CD-FR-ATT-05): When finalized, all `ABSENT` candidates are permanently set to `status=ELIMINATED` globally. They do not reappear in further stages.
5. **PV Auto-Generation** (CD-FR-ATT-06): A PV of Attendance is automatically created on finalization. The document ID and identifier are returned in the finalize response.
6. **Audit Trail**: All sensitive actions (create, toggle, undo, finalize, CSV import) are logged with event names and counts.

---

## Status Codes Summary

| Code | Meaning | Common Causes |
|---|---|---|
| `200 OK` | Request succeeded; response body contains data. | Successful GET or POST (toggle, finalize, import). |
| `201 Created` | New resource created successfully. | POST /api/attendance/records/ (mark) succeeded. |
| `204 No Content` | Request succeeded; no response body. | POST /api/attendance/records/{id}/undo/ succeeded. |
| `400 Bad Request` | Invalid request (validation error). | Missing field, invalid status, duplicate record, finalization blocked, etc. |
| `403 Forbidden` | User lacks permission. | Insufficient role or cross-schedule access attempt. |
| `404 Not Found` | Resource does not exist. | Invalid ID, schedule/submission/record not found. |

---

## Example cURL Commands

### 1. Load candidate list
```bash
curl -X GET "http://127.0.0.1:8000/api/examinations/schedules/8/call_list/" \
  -H "Authorization: Bearer <token>"
```

### 2. Show live counts
```bash
curl -X GET "http://127.0.0.1:8000/api/attendance/submissions/12/counter/" \
  -H "Authorization: Bearer <token>"
```

### 3. Mark a candidate PRESENT
```bash
curl -X POST "http://127.0.0.1:8000/api/attendance/records/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"submission": 12, "candidate": 44, "status": "PRESENT"}'
```

### 4. Toggle a candidate's status
```bash
curl -X POST "http://127.0.0.1:8000/api/attendance/records/87/toggle/" \
  -H "Authorization: Bearer <token>"
```

### 5. Undo a mark
```bash
curl -X POST "http://127.0.0.1:8000/api/attendance/records/87/undo/" \
  -H "Authorization: Bearer <token>"
```

### 6. Finalize submission
```bash
curl -X POST "http://127.0.0.1:8000/api/attendance/submissions/12/finalize/" \
  -H "Authorization: Bearer <token>"
```

### 7. Import CSV
```bash
curl -X POST "http://127.0.0.1:8000/api/attendance/submissions/12/import_csv/" \
  -H "Authorization: Bearer <token>" \
  -F "file=@attendance.csv"
```

---

## References

- **Catalog:** [API_ENDPOINT_CATALOG.md](API_ENDPOINT_CATALOG.md)
- **Integration Guide:** [API_FRONTEND_INTEGRATION.md](API_FRONTEND_INTEGRATION.md)
- **Module README:** [../apps/attendance/README.md](../apps/attendance/README.md)
- **SRS:** [../srs.txt](../srs.txt) (sections CD-FR-ATT-01 through CD-FR-ATT-07)
