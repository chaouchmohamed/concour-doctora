from django.contrib import admin
from .models import UserProfile
from api.models import AuditLog


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'department', 'must_change_password')
    list_filter = ('role', 'must_change_password')
    search_fields = ('user__username', 'user__email')
"""
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'action', 'ip_address')
    list_filter = ('action', 'timestamp')
    readonly_fields = ('user', 'action', 'object_type', 'ip_address', 'timestamp')

    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False"""