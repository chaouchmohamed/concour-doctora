from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError

from apps.candidates.models import Candidate

from .models import CandidateImportBatch

REQUIRED_FIELDS = (
    "first_name",
    "last_name",
    "national_id",
    "email",
    "phone",
    "application_number",
)


def _normalize_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _normalize_row(row: dict[str, Any]) -> dict[str, str]:
    normalized = {field: _normalize_text(row.get(field)) for field in REQUIRED_FIELDS}
    normalized["email"] = normalized["email"].lower()
    return normalized


def _build_error(*, field: str | None, message: str) -> dict[str, str]:
    payload = {"message": message}
    if field:
        payload["field"] = field
    return payload


def validate_import_payload(payload: list[dict]) -> dict:
    """
    Validate API candidate import payload and return normalized valid rows plus detailed errors.
    """
    normalized_rows: list[dict[str, Any]] = []
    invalid_entries: list[dict[str, Any]] = []

    for row_number, item in enumerate(payload, start=1):
        if not isinstance(item, dict):
            invalid_entries.append(
                {
                    "row": row_number,
                    "payload": item,
                    "errors": [
                        _build_error(
                            field=None,
                            message="Each imported row must be a JSON object.",
                        )
                    ],
                }
            )
            continue

        normalized_rows.append(
            {
                "row": row_number,
                "payload": item,
                "data": _normalize_row(item),
            }
        )

    candidate_ids = {
        row["data"]["national_id"]
        for row in normalized_rows
        if row["data"]["national_id"]
    }
    application_numbers = {
        row["data"]["application_number"]
        for row in normalized_rows
        if row["data"]["application_number"]
    }

    existing_national_ids = set(
        Candidate.objects.filter(national_id__in=candidate_ids).values_list("national_id", flat=True)
    )
    existing_application_numbers = set(
        Candidate.objects.filter(application_number__in=application_numbers).values_list(
            "application_number", flat=True
        )
    )

    seen_national_ids: set[str] = set()
    seen_application_numbers: set[str] = set()
    valid_rows: list[dict[str, Any]] = []

    for row in normalized_rows:
        row_number = row["row"]
        candidate_data = row["data"]
        row_errors: list[dict[str, str]] = []

        for field in REQUIRED_FIELDS:
            if not candidate_data[field]:
                row_errors.append(_build_error(field=field, message="This field is required."))

        email = candidate_data["email"]
        if email:
            try:
                validate_email(email)
            except ValidationError:
                row_errors.append(_build_error(field="email", message="Invalid email format."))

        national_id = candidate_data["national_id"]
        if national_id:
            if national_id in seen_national_ids:
                row_errors.append(
                    _build_error(
                        field="national_id",
                        message="Duplicate national_id in current import payload.",
                    )
                )
            if national_id in existing_national_ids:
                row_errors.append(
                    _build_error(
                        field="national_id",
                        message="Candidate with this national_id already exists.",
                    )
                )

        application_number = candidate_data["application_number"]
        if application_number:
            if application_number in seen_application_numbers:
                row_errors.append(
                    _build_error(
                        field="application_number",
                        message="Duplicate application_number in current import payload.",
                    )
                )
            if application_number in existing_application_numbers:
                row_errors.append(
                    _build_error(
                        field="application_number",
                        message="Candidate with this application_number already exists.",
                    )
                )

        if row_errors:
            invalid_entries.append(
                {
                    "row": row_number,
                    "payload": row["payload"],
                    "errors": row_errors,
                }
            )
            continue

        valid_rows.append(
            {
                "row": row_number,
                "data": candidate_data,
            }
        )
        seen_national_ids.add(national_id)
        seen_application_numbers.add(application_number)

    return {
        "total": len(payload),
        "valid_rows": valid_rows,
        "invalid_entries": invalid_entries,
    }


def _persist_valid_rows(valid_rows: list[dict[str, Any]]) -> tuple[list[int], list[dict[str, Any]]]:
    created_candidate_ids: list[int] = []
    persistence_errors: list[dict[str, Any]] = []

    for row in valid_rows:
        row_number = row["row"]
        candidate_data = row["data"]
        try:
            candidate = Candidate.objects.create(**candidate_data)
        except IntegrityError:
            # Safety net for concurrent inserts between validation and write.
            persistence_errors.append(
                {
                    "row": row_number,
                    "payload": candidate_data,
                    "errors": [
                        _build_error(
                            field=None,
                            message="Insert failed due to a uniqueness conflict. Retry import.",
                        )
                    ],
                }
            )
            continue
        created_candidate_ids.append(candidate.id)

    return created_candidate_ids, persistence_errors


def create_import_batch(*, source: str, initiated_by, summary: dict) -> CandidateImportBatch:
    return CandidateImportBatch.objects.create(
        source=source,
        initiated_by=initiated_by,
        total_rows=summary.get("total", 0),
        valid_rows=summary.get("valid", 0),
        invalid_rows=summary.get("invalid", 0),
        status=summary.get("status", "FAILED"),
        error_report={
            "errors": summary.get("errors", []),
            "validated_rows": summary.get("validated_rows", 0),
            "imported_candidate_ids": summary.get("imported_candidate_ids", []),
        },
    )


def process_candidate_import(*, payload: list[dict], initiated_by, source: str = "API") -> tuple[CandidateImportBatch, dict]:
    validation = validate_import_payload(payload)
    created_candidate_ids, persistence_errors = _persist_valid_rows(validation["valid_rows"])

    errors = [*validation["invalid_entries"], *persistence_errors]
    imported_count = len(created_candidate_ids)
    invalid_count = len(errors)

    if imported_count == 0:
        status = "FAILED"
    elif invalid_count > 0:
        status = "COMPLETED_WITH_ERRORS"
    else:
        status = "COMPLETED"

    summary = {
        "total": validation["total"],
        "validated_rows": len(validation["valid_rows"]),
        "valid": imported_count,
        "invalid": invalid_count,
        "status": status,
        "errors": errors,
        "imported_candidate_ids": created_candidate_ids,
    }
    batch = create_import_batch(source=source, initiated_by=initiated_by, summary=summary)
    return batch, summary
