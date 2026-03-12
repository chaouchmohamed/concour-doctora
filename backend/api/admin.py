"""
Django Admin Configuration
"""
from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from .models import *

# Inline for UserProfile
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'

# Extend UserAdmin
class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'get_role', 'is_active')
    list_filter = ('is_active', 'profile__role')
    
    def get_role(self, obj):
        return obj.profile.role if hasattr(obj, 'profile') else '-'
    get_role.short_description = 'Role'
    get_role.admin_order_field = 'profile__role'

# Unregister default UserAdmin and register custom
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

# Register all models
@admin.register(ExamSession)
class ExamSessionAdmin(admin.ModelAdmin):
    list_display = ('name', 'year', 'date', 'status', 'created_at')
    list_filter = ('status', 'year')
    search_fields = ('name', 'description')
    date_hierarchy = 'date'

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'capacity', 'building', 'is_active')
    list_filter = ('is_active', 'building')
    search_fields = ('name',)

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'exam_session', 'coefficient', 'status')
    list_filter = ('status', 'exam_session')
    search_fields = ('name', 'code')

@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('application_number', 'last_name', 'first_name', 'email', 'status', 'exam_session')
    list_filter = ('status', 'exam_session')
    search_fields = ('application_number', 'first_name', 'last_name', 'email', 'national_id')
    date_hierarchy = 'created_at'
    readonly_fields = ('application_number',)

@admin.register(AnonymousCode)
class AnonymousCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'candidate', 'generated_at', 'generated_by')
    search_fields = ('code', 'candidate__application_number')
    readonly_fields = ('code', 'generated_at')

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'session', 'present', 'marked_at', 'marked_by')
    list_filter = ('present', 'session')
    date_hierarchy = 'marked_at'

@admin.register(Copy)
class CopyAdmin(admin.ModelAdmin):
    list_display = ('id', 'anonymous_code', 'subject', 'uploaded_at', 'qr_detected')
    list_filter = ('qr_detected', 'subject')
    date_hierarchy = 'uploaded_at'

@admin.register(Correction)
class CorrectionAdmin(admin.ModelAdmin):
    list_display = ('copy', 'corrector', 'grade', 'attempt', 'submitted_at')
    list_filter = ('attempt',)
    date_hierarchy = 'submitted_at'

@admin.register(Discrepancy)
class DiscrepancyAdmin(admin.ModelAdmin):
    list_display = ('copy', 'difference', 'resolved', 'created_at')
    list_filter = ('resolved',)
    date_hierarchy = 'created_at'

@admin.register(Deliberation)
class DeliberationAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'final_score', 'decision', 'rank', 'closed_at')
    list_filter = ('decision', 'session')
    date_hierarchy = 'closed_at'

@admin.register(PVReport)
class PVReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'session', 'created_at', 'signed')
    list_filter = ('signed', 'session')
    date_hierarchy = 'created_at'

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'action', 'object_type', 'object_id')
    list_filter = ('action', 'object_type')
    date_hierarchy = 'timestamp'
    readonly_fields = ('user', 'action', 'object_type', 'object_id', 'details', 'ip_address', 'user_agent', 'timestamp')
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False