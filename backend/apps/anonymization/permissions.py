from rest_framework.permissions import BasePermission

from apps.accounts.models import RoleChoices


class AnonymousCodeAccessPermission(BasePermission):
    """
    Mapping table access must be ADMIN-only (plus internal process in a later phase).
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role == RoleChoices.ADMIN


class ExamCopyAccessPermission(BasePermission):
    """
    Exam copy upload/association can be handled by Anonymity Commission and ADMIN.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role in {RoleChoices.ADMIN, RoleChoices.ANONYMITY_COMMISSION}
