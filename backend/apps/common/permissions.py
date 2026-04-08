from rest_framework.permissions import BasePermission


class PlaceholderPermission(BasePermission):
    """TODO: replace with module-specific RBAC/object-level permissions."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
