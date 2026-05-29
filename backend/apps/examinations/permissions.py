from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.accounts.models import RoleChoices


class ExaminationAccessPermission(BasePermission):
    WRITE_ROLES = {RoleChoices.ADMIN}
    READ_ROLES = {
        RoleChoices.ADMIN,
        RoleChoices.CFD_HEAD,
        RoleChoices.COORDINATOR,
        RoleChoices.SUPERVISOR,
    }

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return user.role in self.READ_ROLES
        return user.role in self.WRITE_ROLES


class LotteryAccessPermission(BasePermission):
    ROLES = {RoleChoices.ADMIN, RoleChoices.CFD_HEAD}

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role in self.ROLES


class CallListAccessPermission(BasePermission):
    ROLES = {
        RoleChoices.ADMIN,
        RoleChoices.CFD_HEAD,
        RoleChoices.COORDINATOR,
        RoleChoices.SUPERVISOR,
    }

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role in self.ROLES
