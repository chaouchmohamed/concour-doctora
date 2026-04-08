from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.accounts.models import RoleChoices


class CandidateAccessPermission(BasePermission):
    """Skeleton RBAC for candidate records (tighten per endpoint in implementation)."""

    allowed_read_roles = {
        RoleChoices.ADMIN,
        RoleChoices.CFD_HEAD,
        RoleChoices.COORDINATOR,
        RoleChoices.SUPERVISOR,
        RoleChoices.JURY_PRESIDENT,
        RoleChoices.JURY_MEMBER,
    }

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return user.role in self.allowed_read_roles
        return user.role == RoleChoices.ADMIN
