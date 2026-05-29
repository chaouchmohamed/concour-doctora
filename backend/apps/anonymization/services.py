import secrets
import string

from django.conf import settings
from django.core.files.base import ContentFile
from rest_framework.exceptions import ValidationError

from cryptography.fernet import Fernet

from apps.audit.services import log_event
from apps.audit.models import ActionType
from apps.candidates.models import Candidate
from apps.pv.models import PVDocument, PVType
from apps.pv.services import _generate_document_identifier

from .models import AnonymousCode, ExamCopy


ALPHANUMERIC = string.digits + string.ascii_uppercase
CODE_PREFIX = "DOCT"
CODE_SUFFIX_LENGTH = 4


def _get_fernet() -> Fernet:
    key = settings.ANONYMIZATION_ENCRYPTION_KEY
    if not key:
        raise ValidationError(
            {
                "detail": "ANONYMIZATION_ENCRYPTION_KEY is not configured. "
                "Run: python manage.py generate_encryption_key"
            }
        )
    return Fernet(key.encode())


def encrypt_candidate_id(candidate_id: int) -> str:
    f = _get_fernet()
    return f.encrypt(str(candidate_id).encode()).decode()


def decrypt_candidate_id(encrypted: str) -> int:
    f = _get_fernet()
    return int(f.decrypt(encrypted.encode()).decode())


def generate_anonymous_code(year: int, session_id: int) -> str:
    existing_codes = set(
        AnonymousCode.objects.filter(exam_session_id=session_id).values_list(
            "code", flat=True
        )
    )

    for _ in range(1000):
        suffix = "".join(
            secrets.choice(ALPHANUMERIC) for _ in range(CODE_SUFFIX_LENGTH)
        )
        code = f"{CODE_PREFIX}-{year}-{suffix}"
        if code not in existing_codes:
            return code

    raise ValidationError(
        {"detail": "Failed to generate a unique anonymous code after 1000 attempts."}
    )


def _candidate_already_coded(session_id: int, candidate_id: int) -> bool:
    codes = AnonymousCode.objects.filter(exam_session_id=session_id)
    for ac in codes:
        try:
            if decrypt_candidate_id(ac.candidate_id_encrypted) == candidate_id:
                return True
        except Exception:
            continue
    return False


def upload_and_code_copy(
    session_id: int,
    application_number: str,
    uploaded_file,
    user,
) -> ExamCopy:
    try:
        candidate = Candidate.objects.get(application_number=application_number)
    except Candidate.DoesNotExist:
        raise ValidationError(
            {
                "detail": f"No candidate found with application_number '{application_number}'."
            }
        )

    if _candidate_already_coded(session_id, candidate.id):
        raise ValidationError(
            {
                "detail": f"A code already exists for candidate '{application_number}' in this session."
            }
        )

    candidate_id_encrypted = encrypt_candidate_id(candidate.id)

    year = _get_session_year(session_id)
    code_str = generate_anonymous_code(year, session_id)

    anonymous_code = AnonymousCode.objects.create(
        code=code_str,
        candidate_id_encrypted=candidate_id_encrypted,
        exam_session_id=session_id,
    )

    exam_copy = ExamCopy.objects.create(
        anonymous_code=anonymous_code,
        file=uploaded_file,
        uploaded_by_user_id=user.id,
    )

    log_event(
        user=user,
        target=anonymous_code,
        action=ActionType.CREATE,
        details={
            "event": "ANONYMOUS_CODE_GENERATED",
            "code": code_str,
            "exam_session_id": session_id,
        },
    )

    log_event(
        user=user,
        target=exam_copy,
        action=ActionType.CREATE,
        details={
            "event": "EXAM_COPY_UPLOADED",
            "anonymous_code": code_str,
            "exam_session_id": session_id,
        },
    )

    return exam_copy


def _get_session_year(session_id: int) -> int:
    from apps.examinations.models import ExamSession

    try:
        session = ExamSession.objects.get(id=session_id)
        return session.year
    except ExamSession.DoesNotExist:
        raise ValidationError(
            {"detail": f"ExamSession with id {session_id} does not exist."}
        )


def get_session_coding_progress(session_id: int) -> dict:
    from apps.attendance.models import AttendanceSubmission, AttendanceStatus

    present_candidate_ids = set(
        AttendanceSubmission.objects.filter(
            exam_schedule__subject__exam_session_id=session_id,
            is_finalized=True,
        )
        .filter(records__status=AttendanceStatus.PRESENT)
        .values_list("records__candidate_id", flat=True)
    )

    coded_count = AnonymousCode.objects.filter(exam_session_id=session_id).count()
    copies_count = ExamCopy.objects.filter(
        anonymous_code__exam_session_id=session_id
    ).count()

    return {
        "session_id": session_id,
        "total_present_candidates": len(present_candidate_ids),
        "codes_generated": coded_count,
        "copies_uploaded": copies_count,
        "is_complete": coded_count > 0
        and coded_count == copies_count
        and coded_count == len(present_candidate_ids),
    }


def generate_anonymization_pv(session_id: int, user) -> PVDocument:
    progress = get_session_coding_progress(session_id)
    if not progress["is_complete"]:
        raise ValidationError(
            {
                "detail": "Cannot generate PV: not all present candidates have been coded and copies uploaded."
            }
        )

    codes = AnonymousCode.objects.filter(exam_session_id=session_id).order_by("code")
    last_code = codes.last()

    content = (
        f"PV D'ANONYMISATION\n"
        f"====================\n"
        f"Session ID: {session_id}\n"
        f"Nombre de copies codees: {codes.count()}\n"
        f"-------------------\n"
        f"Codes attribues:\n"
    )
    for c in codes:
        content += f"  - {c.code}\n"

    content += f"-------------------\nOperation effectuee le: {last_code.generated_at if last_code else 'N/A'}\n"

    doc_id = _generate_document_identifier()
    pv = PVDocument.objects.create(
        pv_type=PVType.ANONYMIZATION,
        exam_session_id=session_id,
        document_identifier=doc_id,
        generated_by=user,
    )
    pv.file.save(
        f"pv_anonymization_{session_id}.txt", ContentFile(content.encode("utf-8"))
    )

    log_event(
        user=user,
        target=pv,
        action=ActionType.CREATE,
        details={
            "event": "PV_GENERATED",
            "pv_type": PVType.ANONYMIZATION,
            "session_id": session_id,
            "codes_count": codes.count(),
        },
    )

    return pv
