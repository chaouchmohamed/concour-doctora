"""
DRF Serializers for all models
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from .models import *
import re


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile"""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 
                  'phone', 'department', 'signature', 'email_notifications',
                  'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User with profile"""
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 
                  'is_active', 'date_joined', 'last_login', 'profile']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class ExamSessionSerializer(serializers.ModelSerializer):
    """Serializer for ExamSession"""
    subjects_count = serializers.SerializerMethodField()
    candidates_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ExamSession
        fields = ['id', 'name', 'year', 'date', 'status', 'description', 
                  'created_at', 'updated_at', 'created_by', 
                  'subjects_count', 'candidates_count']
        read_only_fields = ['created_by']
    
    def get_subjects_count(self, obj):
        return obj.subjects.count()
    
    def get_candidates_count(self, obj):
        return obj.candidates.count()


class RoomSerializer(serializers.ModelSerializer):
    """Serializer for Room"""
    
    class Meta:
        model = Room
        fields = '__all__'


class SubjectSerializer(serializers.ModelSerializer):
    """Serializer for Subject"""
    exam_session_name = serializers.CharField(source='exam_session.name', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True)
    
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'coefficient', 'max_score', 
                  'discrepancy_threshold', 'final_grade_rule', 'status',
                  'exam_session', 'exam_session_name', 'scheduled_date',
                  'start_time', 'duration_minutes', 'room', 'room_name',
                  'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate subject configuration"""
        if data.get('max_score', 0) <= 0:
            raise serializers.ValidationError("Max score must be positive")
        
        if data.get('coefficient', 0) <= 0:
            raise serializers.ValidationError("Coefficient must be positive")
        
        return data


class CandidateSerializer(serializers.ModelSerializer):
    """Serializer for Candidate"""
    full_name = serializers.SerializerMethodField()
    exam_session_name = serializers.CharField(source='exam_session.name', read_only=True)
    anonymous_code = serializers.SerializerMethodField()
    
    class Meta:
        model = Candidate
        fields = ['id', 'application_number', 'first_name', 'last_name', 'full_name',
                  'national_id', 'email', 'phone', 'date_of_birth', 'place_of_birth',
                  'address', 'status', 'exam_session', 'exam_session_name',
                  'photo', 'national_id_file', 'diploma_file', 'anonymous_code',
                  'created_at', 'updated_at', 'created_by']
        read_only_fields = ['application_number', 'created_by']
    
    def get_full_name(self, obj):
        return f"{obj.last_name} {obj.first_name}"
    
    def get_anonymous_code(self, obj):
        if hasattr(obj, 'anonymous_code'):
            return obj.anonymous_code.code
        return None
    
    def validate_national_id(self, value):
        """Validate national ID format (18 digits)"""
        if not re.match(r'^[0-9]{18}$', value):
            raise serializers.ValidationError("National ID must be exactly 18 digits")
        return value
    
    def validate_email(self, value):
        """Check if email already exists"""
        if self.instance and self.instance.email == value:
            return value
        if Candidate.objects.filter(email=value).exists():
            raise serializers.ValidationError("A candidate with this email already exists")
        return value


class AnonymousCodeSerializer(serializers.ModelSerializer):
    """Serializer for AnonymousCode"""
    candidate_name = serializers.CharField(source='candidate.full_name', read_only=True)
    candidate_application = serializers.CharField(source='candidate.application_number', read_only=True)
    
    class Meta:
        model = AnonymousCode
        fields = ['id', 'candidate', 'candidate_name', 'candidate_application',
                  'code', 'generated_at', 'generated_by']
        read_only_fields = ['code', 'generated_at', 'generated_by']


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for Attendance"""
    candidate_name = serializers.CharField(source='candidate.full_name', read_only=True)
    candidate_application = serializers.CharField(source='candidate.application_number', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.get_full_name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = ['id', 'candidate', 'candidate_name', 'candidate_application',
                  'session', 'present', 'notes', 'photo', 'marked_at', 
                  'marked_by', 'marked_by_name']
        read_only_fields = ['marked_at', 'marked_by']


class CopySerializer(serializers.ModelSerializer):
    """Serializer for Copy"""
    anonymous_code_value = serializers.CharField(source='anonymous_code.code', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    corrections_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Copy
        fields = ['id', 'anonymous_code', 'anonymous_code_value', 'subject',
                  'subject_name', 'scan_file', 'uploaded_at', 'uploaded_by',
                  'uploaded_by_name', 'qr_detected', 'page_count', 'corrections_count']
    
    def get_corrections_count(self, obj):
        return obj.corrections.count()


class CorrectionSerializer(serializers.ModelSerializer):
    """Serializer for Correction"""
    corrector_name = serializers.CharField(source='corrector.get_full_name', read_only=True)
    copy_anonymous_code = serializers.CharField(source='copy.anonymous_code.code', read_only=True)
    subject_name = serializers.CharField(source='copy.subject.name', read_only=True)
    
    class Meta:
        model = Correction
        fields = ['id', 'copy', 'copy_anonymous_code', 'subject_name',
                  'corrector', 'corrector_name', 'grade', 'comment',
                  'attempt', 'submitted_at']
        read_only_fields = ['submitted_at']
    
    def validate(self, data):
        """Validate correction"""
        copy = data.get('copy')
        corrector = data.get('corrector')
        attempt = data.get('attempt', 1)
        
        # Check if corrector already submitted for this attempt
        if Correction.objects.filter(copy=copy, corrector=corrector, attempt=attempt).exists():
            raise serializers.ValidationError("You have already submitted a correction for this attempt")
        
        # Check grade range
        max_score = copy.subject.max_score
        if data.get('grade', 0) > max_score:
            raise serializers.ValidationError(f"Grade cannot exceed {max_score}")
        
        return data


class DiscrepancySerializer(serializers.ModelSerializer):
    """Serializer for Discrepancy"""
    copy_anonymous_code = serializers.CharField(source='copy.anonymous_code.code', read_only=True)
    subject_name = serializers.CharField(source='copy.subject.name', read_only=True)
    third_corrector_name = serializers.CharField(source='third_corrector.get_full_name', read_only=True)
    
    class Meta:
        model = Discrepancy
        fields = ['id', 'copy', 'copy_anonymous_code', 'subject_name',
                  'grade1', 'grade2', 'difference', 'resolved',
                  'third_corrector', 'third_corrector_name', 'third_grade',
                  'final_grade', 'coordinator_note', 'created_at', 'resolved_at']


class DeliberationSerializer(serializers.ModelSerializer):
    """Serializer for Deliberation"""
    candidate_name = serializers.CharField(source='candidate.full_name', read_only=True)
    candidate_application = serializers.CharField(source='candidate.application_number', read_only=True)
    decided_by_name = serializers.CharField(source='decided_by.get_full_name', read_only=True)
    
    class Meta:
        model = Deliberation
        fields = ['id', 'candidate', 'candidate_name', 'candidate_application',
                  'session', 'final_score', 'decision', 'rank',
                  'decided_by', 'decided_by_name', 'closed_at']


class PVReportSerializer(serializers.ModelSerializer):
    """Serializer for PVReport"""
    session_name = serializers.CharField(source='session.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = PVReport
        fields = ['id', 'title', 'session', 'session_name', 'pdf_file',
                  'created_at', 'created_by', 'created_by_name',
                  'signed', 'signers']


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for AuditLog"""
    username = serializers.CharField(source='user.username', read_only=True)
    user_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'username', 'user_full_name', 'action',
                  'object_type', 'object_id', 'details', 'ip_address',
                  'user_agent', 'timestamp']
        read_only_fields = '__all__'
    
    def get_user_full_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
        return "System"


class BulkAttendanceSerializer(serializers.Serializer):
    """Serializer for bulk attendance marking"""
    session_id = serializers.IntegerField()
    attendance = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    
    def validate_attendance(self, value):
        for item in value:
            if 'candidate_id' not in item:
                raise serializers.ValidationError("Each attendance record must have candidate_id")
            if 'present' not in item:
                raise serializers.ValidationError("Each attendance record must have present status")
        return value


class CandidateImportSerializer(serializers.Serializer):
    """Serializer for CSV import"""
    file = serializers.FileField()
    
    def validate_file(self, value):
        if not value.name.endswith('.csv'):
            raise serializers.ValidationError("Only CSV files are supported")
        return value