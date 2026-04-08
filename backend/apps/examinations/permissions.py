from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.accounts.models import RoleChoices


class ExaminationAccessPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return user.role in {
                RoleChoices.ADMIN,
                RoleChoices.CFD_HEAD,
                RoleChoices.COORDINATOR,
                RoleChoices.SUPERVISOR,
            }
        return user.role == RoleChoices.ADMIN
