"""
Anonymization utilities
"""
from ..api.models import AnonymousCode, Candidate
import random
import string


def generate_anonymous_codes(session_id, generated_by):
    """
    Generate anonymous codes for all candidates in a session
    """
    candidates = Candidate.objects.filter(
        exam_session_id=session_id,
        status='REGISTERED'
    ).exclude(
        anonymous_code__isnull=False
    )
    
    created = []
    for candidate in candidates:
        code = AnonymousCode.objects.create(
            candidate=candidate,
            generated_by=generated_by
        )
        created.append(code)
    
    return created


def generate_qr_code(data):
    """
    Generate QR code for anonymous identification
    (Simplified - would use qrcode library in production)
    """
    # This would generate an actual QR code image
    # For now, return a placeholder
    return f"QR-{data}-{random.randint(1000, 9999)}"


def detect_qr_code(image_file):
    """
    Detect and read QR code from uploaded scan
    (Simplified - would use OpenCV/qrcode libraries)
    """
    # Simulate QR detection
    # In production, this would actually read the QR code
    return random.choice([True, False]), "DOCT-2024-0001"