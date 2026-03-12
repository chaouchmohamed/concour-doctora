"""
Custom permissions for role-based access control
"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Admin only access"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.profile.role == 'ADMIN'


class IsCFDHead(permissions.BasePermission):
    """CFD Head access (includes ADMIN)"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = request.user.profile.role
        return role in ['ADMIN', 'CFD_HEAD']


class IsCoordinator(permissions.BasePermission):
    """Coordinator access (includes ADMIN, CFD_HEAD)"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = request.user.profile.role
        return role in ['ADMIN', 'CFD_HEAD', 'COORDINATOR']


class IsCorrector(permissions.BasePermission):
    """Corrector access (only for correction pages)"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = request.user.profile.role
        return role in ['ADMIN', 'CFD_HEAD', 'COORDINATOR', 'CORRECTOR']


class IsSupervisor(permissions.BasePermission):
    """Supervisor access (for attendance)"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = request.user.profile.role
        return role in ['ADMIN', 'CFD_HEAD', 'COORDINATOR', 'SUPERVISOR']


class IsJuryMember(permissions.BasePermission):
    """Jury member access (for deliberation)"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = request.user.profile.role
        return role in ['ADMIN', 'CFD_HEAD', 'JURY_MEMBER']


class IsOwnerOrCoordinator(permissions.BasePermission):
    """Object-level permission for owners or coordinators"""
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        role = request.user.profile.role
        if role in ['ADMIN', 'CFD_HEAD', 'COORDINATOR']:
            return True
        
        # Check if user owns the object
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        elif hasattr(obj, 'corrector'):
            return obj.corrector == request.user
        
        return False


class CanViewAnonymousData(permissions.BasePermission):
    """
    Permission to view anonymous data.
    Correctors can only see anonymous codes, not candidate identities.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        role = request.user.profile.role
        
        # Correctors can only access anonymized views
        if role == 'CORRECTOR':
            # They can only access correction-related endpoints
            allowed_paths = ['/api/copies/', '/api/corrections/']
            path = request.path
            return any(path.startswith(p) for p in allowed_paths)
        
        return True