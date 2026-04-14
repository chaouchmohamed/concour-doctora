# Anonymization Module

Manages anonymous code generation, encrypted identity mapping, and exam copy association for the correction phase.

## Core Models

- **AnonymousCode**: `code` (unique, format `DOCT-YYYY-XXXX`), `candidate_id_encrypted` (Fernet-encrypted), `exam_session_id`, `generated_at`
- **ExamCopy**: `anonymous_code` (FK), `file` (scanned copy), `uploaded_by_user_id`, `qr_detected_code`

All models live in the **anonymization database** (separate schema) via `AnonymizationRouter`.

## Business Rules (SRS CD-FR-ANON-01 to 05)

1. **Code Generation** (CD-FR-ANON-01): Anonymous codes use `DOCT-YYYY-XXXX` format where XXXX is a 4-character alphanumeric suffix from `secrets.choice()` (CSPRNG). 36^4 = 1,679,616 unique combinations. Collision retry up to 1000 times.

2. **Encrypted Mapping** (CD-FR-ANON-02): Candidate IDs are encrypted with Fernet (AES-128-CBC + HMAC-SHA256 authenticated encryption) and stored in the anonymization DB. The key is configured via `ANONYMIZATION_ENCRYPTION_KEY` env var. Only ADMIN can read the encrypted correspondence.

3. **Copy Upload + Code Association** (CD-FR-ANON-03): The Anonymity Commission uploads a scanned copy + enters the candidate's `application_number`. The system generates the anonymous code, encrypts the mapping, and links the copy. One upload = one code + one copy.

4. **Identity Hiding** (CD-FR-ANON-04): Correctors only see `anonymous_code` + `file` on copies. Coordinators see code + file but NOT `candidate_id_encrypted`. Only ADMIN sees encrypted IDs.

5. **PV of Anonymization** (CD-FR-ANON-05): Generated after all present candidates are coded. Records copy count, codes assigned, and timestamp.

## API Endpoints

| Endpoint | Method | SRS Ref | Access | Description |
|---|---|---|---|---|
| `/api/anonymization/upload/` | POST | ANON-03 | ADMIN, ANONYMITY_COMMISSION | Upload copy + generate code |
| `/api/anonymization/codes/` | GET | ANON-02 | ADMIN, COORDINATOR | List anonymous codes |
| `/api/anonymization/copies/` | GET | ANON-04 | ADMIN, ANON_COMM, COORD, CORRECTOR | List exam copies |
| `/api/anonymization/copies/progress/{session_id}/` | GET | — | Same as copies | Coding progress counter |
| `/api/anonymization/copies/generate-pv/{session_id}/` | POST | ANON-05 | Same as copies | Generate PV of Anonymization |

## Encryption Setup

Before using the anonymization module, generate a Fernet key:

```bash
python manage.py generate_encryption_key
```

Add the output to `.env`:
```
ANONYMIZATION_ENCRYPTION_KEY=<generated-key>
```

## Audit Events

- `ANONYMOUS_CODE_GENERATED` — code created with session context
- `EXAM_COPY_UPLOADED` — copy linked to anonymous code
- `PV_GENERATED` (ANONYMIZATION) — PV created with codes count

## Tests

14 tests covering:
- Encryption roundtrip and uniqueness
- Code format (DOCT-YYYY-XXXX) and collision avoidance
- Upload + code creation happy path
- Duplicate rejection, unknown candidate rejection
- Role-based visibility (corrector sees nothing, admin sees encrypted IDs, coordinator sees codes only)
- PV generation (success + incomplete rejection)
