"""
Audit logging utility
"""
from ..api.models import AuditLog
import json


def log_action(user, action, object_type, object_id=None, details=None, request=None):
    """
    Log an action to the audit log
    """
    ip_address = None
    user_agent = None
    
    if request:
        # Get IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        # Get user agent
        user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    # Create log entry
    AuditLog.objects.create(
        user=user if user and user.is_authenticated else None,
        action=action,
        object_type=object_type,
        object_id=str(object_id) if object_id else '',
        details=details or {},
        ip_address=ip_address,
        user_agent=user_agent
    )