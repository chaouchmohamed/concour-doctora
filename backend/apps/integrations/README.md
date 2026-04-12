# Integrations App API Guide

This app currently handles candidate import integration endpoints.

## Base Routes

- `/api/import/candidates/`
- `/api/import/candidates/file/`
- `/api/import/batches/`
- `/api/import/batches/{id}/`

## Auth and Roles

- All routes require JWT authentication.
- Import endpoints are restricted to `ADMIN` role.
- Non-admin authenticated users receive `403 Forbidden`.

## Endpoint: `POST /api/import/candidates/`

### What it does

- Accepts candidate rows from an external system.
- Validates each row.
- Inserts valid rows into `Candidate`.
- Rejects invalid rows with detailed per-row errors.
- Creates one `CandidateImportBatch` tracking the operation.
- Returns a batch payload plus an import `report`.

### Accepted payload format

- A single JSON object (treated as one row).
- A JSON array of objects (batch import).

Required fields per row:

- `first_name`
- `last_name`
- `national_id`
- `email`
- `phone`
- `application_number`

### Validation rules

- Required field check for all required fields.
- Email format validation.
- Duplicate detection inside the same payload:
  - `national_id`
  - `application_number`
- Duplicate detection against database:
  - existing `Candidate.national_id`
  - existing `Candidate.application_number`

### Import behavior

- Valid rows are inserted even if some rows are invalid.
- Import is therefore partial by design when mixed data is sent.
- A DB uniqueness race during insert is captured as a row error.

### Batch status values used by current logic

- `COMPLETED`: all rows imported successfully.
- `COMPLETED_WITH_ERRORS`: some rows imported, some rejected.
- `FAILED`: no row imported.

### Response (current shape)

- Standard `CandidateImportBatch` fields:
  - `id`, `created_at`, `updated_at`, `source`, `initiated_by`
  - `total_rows`, `valid_rows`, `invalid_rows`
  - `status`, `error_report`
- Additional `report` object:
  - `total`
  - `validated_rows`
  - `imported_rows`
  - `invalid_rows`
  - `status`
  - `errors` (per-row list)

### Example request

```json
[
  {
    "first_name": "Ada",
    "last_name": "Lovelace",
    "national_id": "NAT-100",
    "email": "ada100@test.local",
    "phone": "0555001122",
    "application_number": "APP-100"
  }
]
```

### Example response (trimmed)

```json
{
  "id": 7,
  "source": "API",
  "total_rows": 1,
  "valid_rows": 1,
  "invalid_rows": 0,
  "status": "COMPLETED",
  "report": {
    "total": 1,
    "validated_rows": 1,
    "imported_rows": 1,
    "invalid_rows": 0,
    "status": "COMPLETED",
    "errors": []
  }
}
```

### HTTP status codes

- `202 Accepted`: import processed and batch created.
- `401 Unauthorized`: missing/invalid token.
- `403 Forbidden`: authenticated but not allowed role.

## Endpoint: `POST /api/import/candidates/file/`

### What it does

- Accepts an uploaded `.csv` or `.xlsx` file.
- Parses the file rows (first row must be headers).
- Feeds rows through the exact same validation engine as the JSON endpoint.
- Returns the exact same batch payload and error report format.

### Requirements

- Form data must have a `file` key containing the file upload.
- Allowed extensions: `.csv` and `.xlsx`
- Max file size: 5 MB
- Required headers: `first_name`, `last_name`, `national_id`, `email`, `phone`, `application_number`

## Endpoint: `GET /api/import/batches/`

### What it does

- Returns all import batches.
- Ordered by newest first.
- Read-only endpoint.

## Endpoint: `GET /api/import/batches/{id}/`

### What it does

- Returns one import batch by ID.
- Read-only endpoint.

## Side Effects

- Writes to `candidates_candidate` table for valid rows.
- Writes to `integrations_candidateimportbatch` for every import call.
- Stores detailed error report in `CandidateImportBatch.error_report`.

## Related Code

- `apps/integrations/views.py`
- `apps/integrations/services.py`
- `apps/integrations/permissions.py`
- `apps/integrations/serializers.py`
- `apps/integrations/models.py`

## Tests

- `apps/integrations/tests.py`

Current coverage includes:

- admin valid import success
- mixed batch with duplicates and invalid email
- fully invalid batch
- non-admin access denied
