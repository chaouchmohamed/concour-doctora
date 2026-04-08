from .models import CandidateImportBatch


def validate_import_payload(payload: list[dict]) -> dict:
    """
    TODO: implement CSV/XLSX/API schema validation and duplicate checks.
    """
    return {
        "total": len(payload),
        "valid": 0,
        "invalid": len(payload),
        "errors": ["Validation logic not implemented in skeleton."],
    }


def create_import_batch(*, source: str, initiated_by, summary: dict) -> CandidateImportBatch:
    return CandidateImportBatch.objects.create(
        source=source,
        initiated_by=initiated_by,
        total_rows=summary.get("total", 0),
        valid_rows=summary.get("valid", 0),
        invalid_rows=summary.get("invalid", 0),
        status="VALIDATED",
        error_report={"errors": summary.get("errors", [])},
    )
