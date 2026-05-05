"""
File parsers for candidate import.

Converts uploaded CSV or XLSX files into a list of row dicts
suitable for process_candidate_import().
"""
from __future__ import annotations

import csv
import io
from typing import Any

from rest_framework.exceptions import ValidationError

EXPECTED_HEADERS = {
    "first_name",
    "last_name",
    "national_id",
    "email",
    "phone",
    "application_number",
}


def _validate_headers(headers: list[str], format_label: str) -> None:
    """Raise if required headers are missing from the parsed header row."""
    normalised = {h.strip().lower() for h in headers if h}
    missing = EXPECTED_HEADERS - normalised
    if missing:
        raise ValidationError(
            {
                "file": (
                    f"Missing required column(s) in {format_label} file: "
                    f"{', '.join(sorted(missing))}."
                )
            }
        )


def parse_csv(file) -> list[dict[str, Any]]:
    """Read an in-memory uploaded CSV and return a list of row dicts."""
    try:
        text = file.read().decode("utf-8-sig")  # utf-8-sig strips BOM if present
    except UnicodeDecodeError:
        raise ValidationError({"file": "CSV file is not valid UTF-8."})

    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        raise ValidationError({"file": "CSV file is empty or has no header row."})

    _validate_headers(list(reader.fieldnames), "CSV")
    return list(reader)


def parse_xlsx(file) -> list[dict[str, Any]]:
    """Read an in-memory uploaded XLSX and return a list of row dicts."""
    try:
        import openpyxl
    except ImportError:  # pragma: no cover
        raise ValidationError(
            {"file": "XLSX support requires the openpyxl package."}
        )

    try:
        wb = openpyxl.load_workbook(file, read_only=True, data_only=True)
    except Exception:
        raise ValidationError({"file": "Unable to read XLSX file. The file may be corrupt."})

    ws = wb.active
    if ws is None:
        raise ValidationError({"file": "XLSX file contains no worksheets."})

    rows_iter = ws.iter_rows(values_only=True)
    try:
        raw_headers = next(rows_iter)
    except StopIteration:
        raise ValidationError({"file": "XLSX file is empty or has no header row."})

    headers = [str(h).strip().lower() if h else "" for h in raw_headers]
    _validate_headers(headers, "XLSX")

    result: list[dict[str, Any]] = []
    for row_values in rows_iter:
        row_dict = {headers[i]: row_values[i] for i in range(len(headers)) if i < len(row_values)}
        # Skip completely empty rows
        if any(v is not None and str(v).strip() for v in row_values):
            result.append(row_dict)

    wb.close()
    return result


def parse_candidate_file(file, filename: str) -> tuple[list[dict[str, Any]], str]:
    """
    Dispatch to the correct parser based on file extension.

    Returns (rows, source_type) where source_type is 'CSV' or 'XLSX'.
    """
    name_lower = (filename or "").lower()

    if name_lower.endswith(".csv"):
        return parse_csv(file), "CSV"
    elif name_lower.endswith(".xlsx"):
        return parse_xlsx(file), "XLSX"
    else:
        raise ValidationError(
            {"file": "Unsupported file format. Only .csv and .xlsx files are accepted."}
        )
