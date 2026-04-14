from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.accounts.models import RoleChoices


class AnonymousCodeAccessPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return user.role in {RoleChoices.ADMIN, RoleChoices.COORDINATOR}
        return user.role == RoleChoices.ADMIN


class ExamCopyAccessPermission(BasePermission):
    WRITE_ROLES = {RoleChoices.ADMIN, RoleChoices.ANONYMITY_COMMISSION}
    READ_ROLES = {
        RoleChoices.ADMIN,
        RoleChoices.ANONYMITY_COMMISSION,
        RoleChoices.COORDINATOR,
        RoleChoices.CORRECTOR,
    }

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return user.role in self.READ_ROLES
        return user.role in self.WRITE_ROLES


class AnonymizationWritePermission(BasePermission):
    ROLES = {RoleChoices.ADMIN, RoleChoices.ANONYMITY_COMMISSION}

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role in self.ROLES
