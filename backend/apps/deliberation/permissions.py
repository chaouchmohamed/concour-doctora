from rest_framework.permissions import BasePermission

from apps.accounts.models import RoleChoices


class DeliberationAccessPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role in {
            RoleChoices.ADMIN,
            RoleChoices.JURY_PRESIDENT,
            RoleChoices.JURY_MEMBER,
        }


class JuryPresidentOrAdminPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role in {RoleChoices.ADMIN, RoleChoices.JURY_PRESIDENT}
