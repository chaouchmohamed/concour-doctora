from rest_framework.permissions import BasePermission

from .models import RoleChoices


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == RoleChoices.ADMIN)


class HasAnyRole(BasePermission):
    allowed_roles: tuple[str, ...] = tuple()

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and self.allowed_roles
            and user.role in self.allowed_roles
        )


class IsSelfOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.role == RoleChoices.ADMIN or request.user.id == obj.id
