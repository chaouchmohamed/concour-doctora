# Testing Guide

This guide covers both automated test execution and manual verification of key workflows.

## 1. Automated Unit/Integration Tests

The project uses standard Django tests. Due to the multi-database setup, ensure you run them against the test configuration.

### Run All Tests
```bash
python manage.py test --settings=config.settings.test
```

### Run Specific App Tests
```bash
python manage.py test apps.accounts --settings=config.settings.test
python manage.py test apps.integrations --settings=config.settings.test
python manage.py test apps.attendance --settings=config.settings.test
```

---

## 2. Manual Verification (via Swagger/cURL)

Swagger UI is available at `http://localhost:8000/api/docs/`.

### 2.1 Authentication (Auth)
To test protected endpoints, you must first obtain a JWT.

1. **Login**: `POST /api/auth/login/`
   ```json
   {
     "email": "admin@concours.local",
     "password": "StrongPass123!"
   }
   ```
2. **Authorize**: Copy the `access` token from the response. In Swagger UI, click "Authorize" and enter `Bearer <your_token>`.

### 2.2 Candidate Import
Tests the background processing of candidates.

- **API Import**: `POST /api/import/candidates/` with a list of candidate JSON objects.
- **File Import**: `POST /api/import/candidates/file/` uploading a `.csv` or `.xlsx`.
- **Verification**: Check `GET /api/import/batches/` to see the results and any row-level errors.

### 2.3 Attendance
Tests the roll-call and locking logic.

1. **Create Submission**: `POST /api/attendance/submissions/` for a specific room/schedule.
2. **Mark Present/Absent**: `POST /api/attendance/records/` for allocated candidates.
3. **Finalize**: `POST /api/attendance/submissions/{id}/finalize/`.
   - *Failure Case*: Try finalizing before marking all allocated candidates.
   - *Success Case*: Check that absent candidates are now set to `ELIMINATED` status.

### 2.4 Examinations
Tests the scheduling and allocation foundation.

- **Sessions/Rooms**: Use the CRUD endpoints under `/api/examinations/`.
- **Allocations**: Verify that candidates are assigned seat numbers via `ExamAllocation` (linked to `SubjectSchedule`).

---

## 3. Troubleshooting Tests
- **Hangs**: If `manage.py test` hangs, ensure no other instance is running and try clearing the test databases: `rm test_db.sqlite3 test_anon_db.sqlite3`.
- **Environment**: Ensure `.venv` is active and requirements are installed.
