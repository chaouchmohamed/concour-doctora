"""
Database models for CONCOUR DOCTORA.
All 8 tables with complete relationships and constraints.
"""
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.utils import timezone
import json
import uuid

# User Roles
USER_ROLES = [
    ('ADMIN', 'Administrator'),
    ('CFD_HEAD', 'CFD Head'),
    ('COORDINATOR', 'Coordinator'),
    ('CORRECTOR', 'Corrector'),
    ('SUPERVISOR', 'Supervisor'),
    ('JURY_PRESIDENT', 'Jury President'),
    ('JURY_MEMBER', 'Jury Member'),
    ('ANONYMITY_COMMISSION', 'Anonymity Commission'),
]

# Candidate Status
CANDIDATE_STATUS = [
    ('REGISTERED', 'Registered'),
    ('PRESENT', 'Present'),
    ('ELIMINATED', 'Eliminated'),
]

# Exam Session Status
SESSION_STATUS = [
    ('DRAFT', 'Draft'),
    ('ACTIVE', 'Active'),
    ('CLOSED', 'Closed'),
]

# Subject Status
SUBJECT_STATUS = [
    ('DRAFT', 'Draft'),
    ('ACTIVE', 'Active'),
    ('LOCKED', 'Locked'),
]

# Grading Rules
GRADING_RULES = [
    ('AVERAGE', 'Average'),
    ('MEDIAN', 'Median'),
    ('THIRD', 'Third Corrector'),
]

# Deliberation Decision
DECISION_CHOICES = [
    ('ADMITTED', 'Admitted'),
    ('WAITLIST', 'Waitlist'),
    ('REJECTED', 'Rejected'),
]

# Audit Action Types
AUDIT_ACTIONS = [
    ('CREATE', 'Create'),
    ('UPDATE', 'Update'),
    ('DELETE', 'Delete'),
    ('LOGIN', 'Login'),
    ('LOGOUT', 'Logout'),
    ('IMPORT', 'Import'),
    ('EXPORT', 'Export'),
    ('GENERATE_CODE', 'Generate Code'),
    ('UPLOAD_SCAN', 'Upload Scan'),
    ('MARK_ATTENDANCE', 'Mark Attendance'),
    ('SUBMIT_GRADE', 'Submit Grade'),
    ('RESOLVE_DISCREPANCY', 'Resolve Discrepancy'),
    ('CLOSE_SESSION', 'Close Session'),
    ('SIGN_PV', 'Sign PV'),
    ('ASSIGN_ROLE', 'Assign Role'),
    ('INVITE_USER', 'Invite User'),
    ('ACTIVATE_SUBJECT', 'Activate Subject'),
    ('LOCK_SUBJECT', 'Lock Subject'),
    ('REVEAL_IDENTITY', 'Reveal Identity'),
]


class ExamSession(models.Model):
    """
    Exam sessions table
    """
    name = models.CharField(max_length=200)
    year = models.IntegerField()
    date = models.DateField()
    status = models.CharField(max_length=20, choices=SESSION_STATUS, default='DRAFT')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_sessions')
    
    class Meta:
        db_table = 'exam_sessions'
        ordering = ['-year', '-date']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['year']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.year}"


class Room(models.Model):
    """
    Rooms table for exam locations
    """
    name = models.CharField(max_length=100)
    capacity = models.IntegerField(validators=[MinValueValidator(1)])
    building = models.CharField(max_length=100, blank=True)
    floor = models.IntegerField(null=True, blank=True)
    has_projector = models.BooleanField(default=False)
    has_air_conditioning = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'rooms'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} (Capacity: {self.capacity})"


class Subject(models.Model):
    """
    Subjects table with exam configuration
    """
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    coefficient = models.DecimalField(max_digits=4, decimal_places=2, validators=[MinValueValidator(0)])
    max_score = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0)])
    discrepancy_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=2.0)
    final_grade_rule = models.CharField(max_length=20, choices=GRADING_RULES, default='AVERAGE')
    status = models.CharField(max_length=20, choices=SUBJECT_STATUS, default='DRAFT')
    exam_session = models.ForeignKey(ExamSession, on_delete=models.CASCADE, related_name='subjects')
    scheduled_date = models.DateField(null=True, blank=True)
    start_time = models.TimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(validators=[MinValueValidator(30)], default=180)
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='subjects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subjects'
        ordering = ['exam_session', 'scheduled_date']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['exam_session']),
        ]
        unique_together = ['exam_session', 'code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Candidate(models.Model):
    """
    Candidates table with personal information
    """
    # Personal Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    national_id = models.CharField(
        max_length=20, 
        unique=True,
        validators=[RegexValidator(r'^[0-9]{18}$', message='National ID must be 18 digits')]
    )
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    date_of_birth = models.DateField()
    place_of_birth = models.CharField(max_length=100)
    address = models.TextField()
    
    # Application Information
    application_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=CANDIDATE_STATUS, default='REGISTERED')
    exam_session = models.ForeignKey(ExamSession, on_delete=models.PROTECT, related_name='candidates')
    
    # Documents
    photo = models.ImageField(upload_to='candidate_photos/', null=True, blank=True)
    national_id_file = models.FileField(upload_to='candidate_documents/', null=True, blank=True)
    diploma_file = models.FileField(upload_to='candidate_documents/', null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_candidates')
    
    class Meta:
        db_table = 'candidates'
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['application_number']),
            models.Index(fields=['national_id']),
            models.Index(fields=['email']),
            models.Index(fields=['exam_session']),
        ]
    
    def __str__(self):
        return f"{self.application_number} - {self.last_name} {self.first_name}"
    
    def save(self, *args, **kwargs):
        if not self.application_number:
            # Generate application number: CONC-YYYY-XXXX
            year = self.exam_session.year if self.exam_session else timezone.now().year
            last_candidate = Candidate.objects.filter(
                application_number__startswith=f"CONC-{year}"
            ).order_by('-application_number').first()
            
            if last_candidate:
                last_num = int(last_candidate.application_number.split('-')[-1])
                new_num = str(last_num + 1).zfill(4)
            else:
                new_num = '0001'
            
            self.application_number = f"CONC-{year}-{new_num}"
        
        super().save(*args, **kwargs)


class AnonymousCode(models.Model):
    """
    Anonymous codes for blind correction
    """
    candidate = models.OneToOneField(Candidate, on_delete=models.CASCADE, related_name='anonymous_code')
    code = models.CharField(max_length=50, unique=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='generated_codes')
    
    class Meta:
        db_table = 'anonymous_codes'
        indexes = [
            models.Index(fields=['code']),
        ]
    
    def __str__(self):
        return self.code
    
    def save(self, *args, **kwargs):
        if not self.code:
            # Generate code: DOCT-YYYY-XXXX
            year = timezone.now().year
            last_code = AnonymousCode.objects.filter(
                code__startswith=f"DOCT-{year}"
            ).order_by('-code').first()
            
            if last_code:
                last_num = int(last_code.code.split('-')[-1])
                new_num = str(last_num + 1).zfill(4)
            else:
                new_num = '0001'
            
            self.code = f"DOCT-{year}-{new_num}"
        
        super().save(*args, **kwargs)


class Attendance(models.Model):
    """
    Attendance records for candidates
    """
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='attendance_records')
    session = models.ForeignKey(ExamSession, on_delete=models.CASCADE, related_name='attendance_records')
    present = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    photo = models.ImageField(upload_to='attendance_photos/', null=True, blank=True)
    marked_at = models.DateTimeField(auto_now_add=True)
    marked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='marked_attendance')
    
    class Meta:
        db_table = 'attendance'
        ordering = ['-marked_at']
        indexes = [
            models.Index(fields=['present']),
            models.Index(fields=['session']),
            models.Index(fields=['candidate']),
        ]
        unique_together = ['candidate', 'session']
    
    def __str__(self):
        return f"{self.candidate} - {'Present' if self.present else 'Absent'}"


class Copy(models.Model):
    """
    Exam copies (scanned)
    """
    anonymous_code = models.ForeignKey(AnonymousCode, on_delete=models.PROTECT, related_name='copies')
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT, related_name='copies')
    scan_file = models.FileField(upload_to='scans/%Y/%m/%d/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_copies')
    qr_detected = models.BooleanField(default=False)
    page_count = models.IntegerField(default=1)
    
    class Meta:
        db_table = 'copies'
        verbose_name_plural = 'copies'
        indexes = [
            models.Index(fields=['anonymous_code']),
            models.Index(fields=['subject']),
            models.Index(fields=['uploaded_at']),
        ]
        unique_together = ['anonymous_code', 'subject']
    
    def __str__(self):
        return f"Copy {self.id} - {self.anonymous_code}"


class Correction(models.Model):
    """
    Corrections/grades for copies (double-blind)
    """
    copy = models.ForeignKey(Copy, on_delete=models.CASCADE, related_name='corrections')
    corrector = models.ForeignKey(User, on_delete=models.PROTECT, related_name='corrections')
    grade = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0)])
    comment = models.TextField(blank=True)
    attempt = models.IntegerField(choices=[(1, 'First'), (2, 'Second'), (3, 'Third')], default=1)
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'corrections'
        ordering = ['copy', 'attempt']
        indexes = [
            models.Index(fields=['corrector']),
            models.Index(fields=['submitted_at']),
        ]
        unique_together = ['copy', 'attempt']
    
    def __str__(self):
        return f"Correction {self.attempt} - {self.grade}"


class Discrepancy(models.Model):
    """
    Discrepancies between corrections
    """
    copy = models.OneToOneField(Copy, on_delete=models.CASCADE, related_name='discrepancy')
    grade1 = models.DecimalField(max_digits=5, decimal_places=2)
    grade2 = models.DecimalField(max_digits=5, decimal_places=2)
    difference = models.DecimalField(max_digits=5, decimal_places=2)
    resolved = models.BooleanField(default=False)
    third_corrector = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, 
        related_name='resolved_discrepancies'
    )
    third_grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    final_grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    coordinator_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'discrepancies'
        verbose_name_plural = 'discrepancies'
        indexes = [
            models.Index(fields=['resolved']),
        ]
    
    def __str__(self):
        return f"Discrepancy {self.id} - Diff: {self.difference}"


class Deliberation(models.Model):
    """
    Deliberation results
    """
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='deliberations')
    session = models.ForeignKey(ExamSession, on_delete=models.CASCADE, related_name='deliberations')
    final_score = models.DecimalField(max_digits=5, decimal_places=2)
    decision = models.CharField(max_length=20, choices=DECISION_CHOICES)
    rank = models.IntegerField(null=True, blank=True)
    decided_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='decisions')
    closed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'deliberations'
        ordering = ['rank']
        indexes = [
            models.Index(fields=['decision']),
            models.Index(fields=['session']),
        ]
        unique_together = ['candidate', 'session']
    
    def __str__(self):
        return f"{self.candidate} - {self.decision}"


class PVReport(models.Model):
    """
    PV (Procès-Verbal) Reports
    """
    title = models.CharField(max_length=200)
    session = models.ForeignKey(ExamSession, on_delete=models.CASCADE, related_name='pv_reports')
    pdf_file = models.FileField(upload_to='pv/%Y/%m/%d/')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_pvs')
    signed = models.BooleanField(default=False)
    signers = models.JSONField(default=list)  # List of signers with signatures
    
    class Meta:
        db_table = 'pv_reports'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.created_at.date()}"


class AuditLog(models.Model):
    """
    Immutable audit logs for all sensitive actions
    """
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=50, choices=AUDIT_ACTIONS)
    object_type = models.CharField(max_length=50)
    object_id = models.CharField(max_length=50, blank=True)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['action']),
            models.Index(fields=['object_type']),
            models.Index(fields=['timestamp']),
        ]
        # Make it immutable - no updates allowed
        permissions = [
            ("can_view_audit_logs", "Can view audit logs"),
        ]
    
    def save(self, *args, **kwargs):
        if self.pk:
            # Prevent updates
            raise ValueError("Audit logs cannot be modified after creation")
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        # Prevent deletion
        raise ValueError("Audit logs cannot be deleted")
    
    def __str__(self):
        return f"{self.timestamp} - {self.user} - {self.action} - {self.object_type}"