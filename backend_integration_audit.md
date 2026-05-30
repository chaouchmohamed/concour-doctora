# Backend Integration Audit — ConcoursDoctor Frontend

Full audit of all 18 page files in `frontend/src/pages/` against the Django REST API.

---

## Summary Table

| Page | Status | Notes |
|------|--------|-------|
| `Auth.tsx` (Login) | ✅ Connected | Uses `useAuth().login()` → `POST /api/auth/login/` |
| `ForgotPassword.tsx` | ❌ Broken | Calls `/api/auth/forgot-password/`, `/verify-otp/`, `/reset-password/` — **routes do NOT exist** in backend |
| `ChangePassword.tsx` | ❌ Broken | Calls `POST /api/auth/change-password/` — **route does NOT exist** in backend |
| `Landing.tsx` | ✅ N/A | Static marketing page — no backend needed |
| `NotFound.tsx` | ✅ N/A | Static 404 page — no backend needed |
| `Dashboard.tsx` | ⚠️ Partial | KPI stats are live from API. Deadlines, checklists, and JuryPresident KPIs are **hardcoded static data** |
| `Candidates.tsx` | ✅ Connected | Full CRUD via `api.candidates.*` — list, create, update, import CSV, export |
| `ExamPlanning.tsx` | ✅ Connected | Full CRUD via `api.sessions.*` + `api.subjects.*` |
| `Supervisor.tsx` | ✅ Connected | Fetches live sessions + candidates; submits via `api.attendance.bulk()` with offline sync |
| `Anonymization.tsx` | ⚠️ Partial | Listing and upload work. **`api.candidates.generateCode()` is a no-op stub** |
| `Correction.tsx` | ✅ Connected | Uses `api.corrections.*` + `api.copies.*` + `api.users.*` |
| `Discrepancies.tsx` | ⚠️ Partial | List + assign 3rd corrector work. **`api.discrepancies.resolve()` is a stub** |
| `Deliberation.tsx` | ⚠️ Partial | Data loaded live. **`api.pv.generate()` is a stub** — returns fake object, no real PDF |
| `OfficialResults.tsx` | ⚠️ Partial | Results fetched live. **`api.pv.generate()` stub** makes PV download broken |
| `UserManagement.tsx` | ✅ Connected | Uses `api.users.list()`, `.invite()`, `.changeRole()`, `.update()` |
| `AuditTrail.tsx` | ✅ Connected | Uses `api.auditLogs.list()` + `api.auditLogs.exportCsv()` |
| `SystemSettings.tsx` | ❌ NOT Connected | **100% local state only.** Save button shows success toast but sends nothing to backend |
| `CreateConcour.tsx` | ⚠️ Partial | Needs individual verification |

---

## Critical Issues (Priority Ordered)

### 🔴 Issue 1: `ChangePassword.tsx` — Missing Backend Endpoint
`AuthContext.tsx` line 198 calls:
```
POST /api/auth/change-password/
```
This route **does not exist**. The backend `apps/accounts/urls.py` only has:
`login/`, `refresh/`, `logout/`, `me/`, `invites/`, `set-password/`, and the users router.

**Impact:** First-login forced password change AND voluntary password changes both return 404. Users with `must_change_password=True` are stuck.

---

### 🔴 Issue 2: `ForgotPassword.tsx` — 3 Missing Backend Endpoints
The page calls:
- `POST /api/auth/forgot-password/`
- `POST /api/auth/verify-otp/`
- `POST /api/auth/reset-password/`

**None of these exist** in the backend.

**Impact:** The entire forgot-password/OTP flow returns 404. Users cannot self-reset passwords.

---

### 🔴 Issue 3: `SystemSettings.tsx` — Completely Disconnected
`handleSave()` only calls `setSaved(true)` — no API call whatsoever. All settings (institution name, SMTP config, exam defaults, security policies) are hardcoded defaults that reset on page reload.

**Impact:** Admins think they're configuring the system but nothing persists.

---

### 🟠 Issue 4: `api.pv.generate()` is a Stub
```typescript
// api.ts line 764
generate: async (session_id: number, title?: string) => ({
  id: 0,           // ← fake
  pdf_file: '',    // ← empty
  ...
}),
```
Never calls the backend. `pv.downloadUrl(0)` → `GET /api/pv/documents/0/` will 404.

**Affects:** `Deliberation.tsx` and `OfficialResults.tsx` — PV generation and download are broken.

**Fix:** The backend `PVDocumentViewSet` exists at `POST /api/pv/documents/` — just call it.

---

### 🟠 Issue 5: `api.discrepancies.resolve()` is a Stub
```typescript
// api.ts line 697
resolve: async (_id, _final_grade, _note) => ({ status: 'unsupported-by-backend' }),
```
Coordinators cannot mark discrepancies as resolved directly — only assign 3rd correctors (which works).

---

### 🟠 Issue 6: `api.candidates.generateCode()` is a No-op
```typescript
// api.ts line 610
generateCode: async (_id: number) => ({ status: 'noop' }),
```
The "generate anonymous code" button in `Anonymization.tsx` does nothing.

---

### 🟡 Issue 7: Dashboard — Hardcoded Deadlines & Checklists
All role dashboards show **hardcoded upcoming deadlines** like:
- *"Anonymization Batch #42 — Due in 4 hours"*
- *"Grade 7 remaining copies — Due today at 18:00"*

And the **JuryPresidentDashboard** shows hardcoded KPIs:
- **1,190 ranked, 45 admitted, 15 waitlist, 2/3 subjects** ← never fetched from API

**Impact:** Misleading/wrong information shown to Jury President and all other roles.

---

## What IS Working Correctly

| Module | API Calls Working |
|--------|-------------------|
| Login / Logout | `POST /api/auth/login/`, `POST /api/auth/logout/` |
| Session CRUD | `GET/POST/PATCH/DELETE /api/examinations/sessions/` |
| Subject CRUD | `GET/POST/PATCH/DELETE /api/examinations/subjects/` |
| Candidate CRUD + Import | `GET/POST/PATCH/DELETE /api/candidates/`, `POST /api/import/candidates/file/` |
| Supervisor Attendance | `GET /api/attendance/submissions/`, `POST /api/attendance/records/` |
| Copy Upload | `POST /api/anonymization/upload/` |
| Copy Listing | `GET /api/anonymization/copies/` |
| Grade Submission | `POST /api/correction/grades/submit/` |
| Discrepancy Listing | `GET /api/correction/discrepancies/` |
| Assign 3rd Corrector | `POST /api/correction/discrepancies/{id}/assign-third-corrector/` |
| Deliberation Runs | `GET/POST /api/deliberation/runs/` + `/compute/` + `/close/` |
| Deliberation Results | `GET /api/deliberation/results/` |
| PV Listing | `GET /api/pv/documents/` |
| PV Signing | `POST /api/pv/signatures/` |
| Audit Logs | `GET /api/audit/logs/` |
| User Management | `GET/PATCH /api/auth/users/`, `POST /api/auth/invites/` |
| Current User | `GET /api/auth/me/` |
| Dashboard KPIs | Aggregated from live sessions, candidates, corrections, discrepancies, audit logs |

---

## Recommended Fixes (Priority Order)

| # | Priority | Fix |
|---|----------|-----|
| 1 | 🔴 HIGH | Add `POST /api/auth/change-password/` backend endpoint |
| 2 | 🔴 HIGH | Add forgot-password endpoints OR remove the ForgotPassword page |
| 3 | 🔴 HIGH | Fix `api.pv.generate()` to call `POST /api/pv/documents/` |
| 4 | 🟠 MEDIUM | Fix `api.discrepancies.resolve()` with actual backend call |
| 5 | 🟠 MEDIUM | Fix `api.candidates.generateCode()` with actual anonymization endpoint |
| 6 | 🟠 MEDIUM | Replace hardcoded JuryPresident KPIs with deliberation API data |
| 7 | 🟡 LOW | Replace hardcoded Deadlines/Checklists with dynamic data or remove them |
| 8 | 🟡 LOW | Add a system settings backend endpoint + wire `SystemSettings.tsx` to it |
