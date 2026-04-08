from rest_framework.permissions import BasePermission

from apps.accounts.models import RoleChoices


class AuditAdminOnlyPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == RoleChoices.ADMIN)
