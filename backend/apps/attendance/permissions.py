from rest_framework.permissions import BasePermission

from apps.accounts.models import RoleChoices


class AttendanceAccessPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role in {RoleChoices.ADMIN, RoleChoices.SUPERVISOR}
