"""
API Views for all endpoints
"""
from rest_framework import viewsets, status, filters, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone
from django.http import FileResponse
from django.shortcuts import get_object_or_404
import csv
import io
import pandas as pd
from datetime import datetime
import os

from .models import *
from .serializers import *
from .permissions import *
from utils.audit import log_action
from utils.anonymizer import generate_anonymous_codes
from pdf_generator.generators import generate_pv_report, generate_call_list
from auth_app.models import UserProfile

# ========== USER VIEWS ==========

class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for User management"""
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'profile__role']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'last_login']
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def invite(self, request):
        """Invite a new user"""
        email = request.data.get('email')
        role = request.data.get('role')
        
        if not email or not role:
            return Response(
                {'error': 'Email and role are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate username from email
        username = email.split('@')[0]
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=request.data.get('first_name', ''),
            last_name=request.data.get('last_name', ''),
            is_active=True
        )
        
        # Set random password (user will reset)
        user.set_password(User.objects.make_random_password())
        user.save()
        
        # Create profile
        UserProfile.objects.create(
            user=user,
            role=role,
            phone=request.data.get('phone', ''),
            department=request.data.get('department', '')
        )
        
        # Send invitation email (implement email sending)
        # send_invitation_email(user, request.data.get('password'))
        
        # Log action
        log_action(
            user=request.user,
            action='INVITE_USER',
            object_type='User',
            object_id=user.id,
            details={'email': email, 'role': role},
            request=request
        )
        
        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['put'], permission_classes=[IsAuthenticated, IsAdmin])
    def change_role(self, request, pk=None):
        """Change user role"""
        user = self.get_object()
        new_role = request.data.get('role')
        
        if not new_role:
            return Response(
                {'error': 'Role is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update profile role
        profile = user.profile
        old_role = profile.role
        profile.role = new_role
        profile.save()
        
        # Log action
        log_action(
            user=request.user,
            action='ASSIGN_ROLE',
            object_type='User',
            object_id=user.id,
            details={'old_role': old_role, 'new_role': new_role},
            request=request
        )
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


# ========== SESSION VIEWS ==========

class ExamSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for ExamSession"""
    queryset = ExamSession.objects.all().order_by('-year', '-date')
    serializer_class = ExamSessionSerializer
    permission_classes = [IsAuthenticated, IsCoordinator]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'year']
    search_fields = ['name', 'description']
    
    def perform_create(self, serializer):
        session = serializer.save(created_by=self.request.user)
        log_action(
            user=self.request.user,
            action='CREATE',
            object_type='ExamSession',
            object_id=session.id,
            details={'name': session.name, 'year': session.year},
            request=self.request
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCoordinator])
    def activate(self, request, pk=None):
        """Activate session"""
        session = self.get_object()
        session.status = 'ACTIVE'
        session.save()
        
        log_action(
            user=request.user,
            action='UPDATE',
            object_type='ExamSession',
            object_id=session.id,
            details={'status': 'ACTIVE'},
            request=request
        )
        
        return Response({'status': 'Session activated'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCoordinator])
    def close(self, request, pk=None):
        """Close session"""
        session = self.get_object()
        session.status = 'CLOSED'
        session.save()
        
        log_action(
            user=request.user,
            action='CLOSE_SESSION',
            object_type='ExamSession',
            object_id=session.id,
            request=request
        )
        
        return Response({'status': 'Session closed'})


# ========== SUBJECT VIEWS ==========

class SubjectViewSet(viewsets.ModelViewSet):
    """ViewSet for Subject"""
    queryset = Subject.objects.all().order_by('exam_session', 'scheduled_date')
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated, IsCoordinator]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'exam_session']
    search_fields = ['name', 'code']
    
    def perform_create(self, serializer):
        subject = serializer.save()
        log_action(
            user=self.request.user,
            action='CREATE',
            object_type='Subject',
            object_id=subject.id,
            details={'name': subject.name, 'code': subject.code},
            request=self.request
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCoordinator])
    def activate(self, request, pk=None):
        """Activate subject"""
        subject = self.get_object()
        subject.status = 'ACTIVE'
        subject.save()
        
        log_action(
            user=request.user,
            action='ACTIVATE_SUBJECT',
            object_type='Subject',
            object_id=subject.id,
            request=request
        )
        
        return Response({'status': 'Subject activated'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCoordinator])
    def lock(self, request, pk=None):
        """Lock subject (no more corrections)"""
        subject = self.get_object()
        subject.status = 'LOCKED'
        subject.save()
        
        log_action(
            user=request.user,
            action='LOCK_SUBJECT',
            object_type='Subject',
            object_id=subject.id,
            request=request
        )
        
        return Response({'status': 'Subject locked'})


# ========== CANDIDATE VIEWS ==========

class CandidateViewSet(viewsets.ModelViewSet):
    """ViewSet for Candidate"""
    queryset = Candidate.objects.all().order_by('last_name', 'first_name')
    serializer_class = CandidateSerializer
    permission_classes = [IsAuthenticated, IsCoordinator]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'exam_session']
    search_fields = ['first_name', 'last_name', 'application_number', 'email', 'national_id']
    ordering_fields = ['last_name', 'created_at', 'application_number']
    
    def get_queryset(self):
        """Filter queryset based on user role"""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Correctors can only see candidates they're correcting (through anonymous codes)
        if user.profile.role == 'CORRECTOR':
            # Get copies assigned to this corrector
            copy_ids = Correction.objects.filter(corrector=user).values_list('copy_id', flat=True)
            candidate_ids = Copy.objects.filter(id__in=copy_ids).values_list(
                'anonymous_code__candidate_id', flat=True
            )
            queryset = queryset.filter(id__in=candidate_ids)
        
        return queryset
    
    def perform_create(self, serializer):
        candidate = serializer.save(created_by=self.request.user)
        log_action(
            user=self.request.user,
            action='CREATE',
            object_type='Candidate',
            object_id=candidate.id,
            details={'name': str(candidate), 'application': candidate.application_number},
            request=self.request
        )
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsCoordinator])
    def import_csv(self, request):
        """Import candidates from CSV"""
        file = request.FILES.get('file')
        session_id = request.data.get('session_id')
        
        if not file or not session_id:
            return Response(
                {'error': 'File and session_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            session = ExamSession.objects.get(id=session_id)
        except ExamSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Read CSV
        try:
            df = pd.read_csv(io.BytesIO(file.read()))
            
            # Validate required columns
            required_columns = ['first_name', 'last_name', 'national_id', 'email', 'phone']
            if not all(col in df.columns for col in required_columns):
                return Response(
                    {'error': f'CSV must contain columns: {", ".join(required_columns)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            created = []
            errors = []
            
            for index, row in df.iterrows():
                try:
                    # Check if candidate already exists
                    if Candidate.objects.filter(
                        Q(email=row['email']) | Q(national_id=str(row['national_id']))
                    ).exists():
                        errors.append(f"Row {index + 2}: Candidate already exists")
                        continue
                    
                    candidate = Candidate.objects.create(
                        first_name=row['first_name'],
                        last_name=row['last_name'],
                        national_id=str(row['national_id']),
                        email=row['email'],
                        phone=str(row['phone']),
                        date_of_birth=row.get('date_of_birth', timezone.now().date()),
                        place_of_birth=row.get('place_of_birth', ''),
                        address=row.get('address', ''),
                        exam_session=session,
                        created_by=request.user
                    )
                    created.append(candidate.id)
                    
                except Exception as e:
                    errors.append(f"Row {index + 2}: {str(e)}")
            
            # Log action
            log_action(
                user=request.user,
                action='IMPORT',
                object_type='Candidate',
                details={'created': len(created), 'errors': len(errors)},
                request=request
            )
            
            return Response({
                'created': len(created),
                'errors': errors
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to process CSV: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsCoordinator])
    def export(self, request):
        """Export candidates to CSV"""
        session_id = request.query_params.get('session')
        queryset = self.filter_queryset(self.get_queryset())
        
        if session_id:
            queryset = queryset.filter(exam_session_id=session_id)
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Application Number', 'First Name', 'Last Name', 'National ID',
            'Email', 'Phone', 'Status', 'Exam Session'
        ])
        
        # Write data
        for candidate in queryset:
            writer.writerow([
                candidate.application_number,
                candidate.first_name,
                candidate.last_name,
                candidate.national_id,
                candidate.email,
                candidate.phone,
                candidate.status,
                candidate.exam_session.name
            ])
        
        # Log action
        log_action(
            user=request.user,
            action='EXPORT',
            object_type='Candidate',
            details={'count': queryset.count()},
            request=request
        )
        
        response = Response(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="candidates.csv"'
        return response
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCoordinator])
    def generate_code(self, request, pk=None):
        """Generate anonymous code for candidate"""
        candidate = self.get_object()
        
        # Check if code already exists
        if hasattr(candidate, 'anonymous_code'):
            return Response(
                {'error': 'Anonymous code already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate code
        code = AnonymousCode.objects.create(
            candidate=candidate,
            generated_by=request.user
        )
        
        log_action(
            user=request.user,
            action='GENERATE_CODE',
            object_type='AnonymousCode',
            object_id=code.id,
            details={'candidate': candidate.application_number, 'code': code.code},
            request=request
        )
        
        serializer = AnonymousCodeSerializer(code)
        return Response(serializer.data)


# ========== ATTENDANCE VIEWS ==========

class AttendanceViewSet(viewsets.ModelViewSet):
    """ViewSet for Attendance"""
    queryset = Attendance.objects.all().order_by('-marked_at')
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsSupervisor]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['present', 'session']
    
    def perform_create(self, serializer):
        attendance = serializer.save(marked_by=self.request.user)
        log_action(
            user=self.request.user,
            action='MARK_ATTENDANCE',
            object_type='Attendance',
            object_id=attendance.id,
            details={
                'candidate': attendance.candidate.application_number,
                'present': attendance.present
            },
            request=self.request
        )
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsSupervisor])
    def bulk(self, request):
        """Mark attendance in bulk"""
        serializer = BulkAttendanceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        session_id = data['session_id']
        attendance_list = data['attendance']
        
        created = []
        for item in attendance_list:
            try:
                attendance, created_flag = Attendance.objects.update_or_create(
                    candidate_id=item['candidate_id'],
                    session_id=session_id,
                    defaults={
                        'present': item['present'] == 'true' or item['present'] == True,
                        'notes': item.get('notes', ''),
                        'marked_by': request.user
                    }
                )
                if created_flag:
                    created.append(attendance.id)
            except Exception as e:
                pass
        
        log_action(
            user=request.user,
            action='MARK_ATTENDANCE',
            object_type='Attendance',
            details={'count': len(created)},
            request=request
        )
        
        return Response({'created': len(created)})


# ========== COPY VIEWS ==========

class CopyViewSet(viewsets.ModelViewSet):
    """ViewSet for Copies"""
    queryset = Copy.objects.all().order_by('-uploaded_at')
    serializer_class = CopySerializer
    permission_classes = [IsAuthenticated, IsCoordinator]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['subject', 'qr_detected']
    
    def get_queryset(self):
        """Filter based on user role"""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Correctors only see copies assigned to them
        if user.profile.role == 'CORRECTOR':
            correction_copy_ids = Correction.objects.filter(
                corrector=user
            ).values_list('copy_id', flat=True)
            queryset = queryset.filter(id__in=correction_copy_ids)
        
        return queryset
    
    def perform_create(self, serializer):
        copy = serializer.save(uploaded_by=self.request.user)
        log_action(
            user=self.request.user,
            action='UPLOAD_SCAN',
            object_type='Copy',
            object_id=copy.id,
            details={
                'anonymous_code': copy.anonymous_code.code,
                'subject': copy.subject.name
            },
            request=self.request
        )
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsCorrector])
    def download(self, request, pk=None):
        """Download scan file"""
        copy = self.get_object()
        file_path = copy.scan_file.path
        
        if os.path.exists(file_path):
            return FileResponse(
                open(file_path, 'rb'),
                as_attachment=True,
                filename=f"copy_{copy.anonymous_code.code}.pdf"
            )
        
        return Response(
            {'error': 'File not found'},
            status=status.HTTP_404_NOT_FOUND
        )


# ========== CORRECTION VIEWS ==========

class CorrectionViewSet(viewsets.ModelViewSet):
    """ViewSet for Corrections"""
    queryset = Correction.objects.all().order_by('-submitted_at')
    serializer_class = CorrectionSerializer
    permission_classes = [IsAuthenticated, IsCorrector]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['copy', 'attempt']
    
    def get_queryset(self):
        """Filter to only show user's corrections"""
        user = self.request.user
        if user.profile.role in ['ADMIN', 'CFD_HEAD', 'COORDINATOR']:
            return super().get_queryset()
        return super().get_queryset().filter(corrector=user)
    
    def perform_create(self, serializer):
        correction = serializer.save(corrector=self.request.user)
        
        # Check if we need to create a discrepancy
        copy = correction.copy
        attempt = correction.attempt
        
        # Get all corrections for this copy
        corrections = Correction.objects.filter(copy=copy)
        
        # If we have both first and second corrections, check for discrepancy
        if corrections.filter(attempt=1).exists() and corrections.filter(attempt=2).exists():
            grade1 = corrections.get(attempt=1).grade
            grade2 = corrections.get(attempt=2).grade
            difference = abs(float(grade1) - float(grade2))
            
            threshold = float(copy.subject.discrepancy_threshold)
            
            if difference > threshold:
                # Create discrepancy
                discrepancy, created = Discrepancy.objects.get_or_create(
                    copy=copy,
                    defaults={
                        'grade1': grade1,
                        'grade2': grade2,
                        'difference': difference
                    }
                )
                
                if not created:
                    # Update existing
                    discrepancy.grade1 = grade1
                    discrepancy.grade2 = grade2
                    discrepancy.difference = difference
                    discrepancy.resolved = False
                    discrepancy.save()
        
        log_action(
            user=self.request.user,
            action='SUBMIT_GRADE',
            object_type='Correction',
            object_id=correction.id,
            details={
                'copy': copy.id,
                'attempt': attempt,
                'grade': float(correction.grade)
            },
            request=self.request
        )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsCorrector])
    def assigned(self, request):
        """Get copies assigned to current corrector"""
        user = request.user
        
        # Get copies where user has already corrected
        corrected_copy_ids = Correction.objects.filter(
            corrector=user
        ).values_list('copy_id', flat=True)
        
        # Get all copies that need correction for this user
        # This depends on assignment logic (simplified here)
        # In a real system, you'd have an assignment table
        
        copies = Copy.objects.filter(
            subject__status='ACTIVE'
        ).exclude(
            id__in=corrected_copy_ids
        )[:10]  # Limit for demo
        
        serializer = CopySerializer(copies, many=True)
        return Response(serializer.data)


# ========== DISCREPANCY VIEWS ==========

class DiscrepancyViewSet(viewsets.ModelViewSet):
    """ViewSet for Discrepancies"""
    queryset = Discrepancy.objects.all().order_by('-created_at')
    serializer_class = DiscrepancySerializer
    permission_classes = [IsAuthenticated, IsCoordinator]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['resolved']
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCoordinator])
    def assign_third(self, request, pk=None):
        """Assign third corrector"""
        discrepancy = self.get_object()
        corrector_id = request.data.get('corrector_id')
        
        if not corrector_id:
            return Response(
                {'error': 'Corrector ID required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            corrector = User.objects.get(id=corrector_id, profile__role='CORRECTOR')
        except User.DoesNotExist:
            return Response(
                {'error': 'Corrector not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        discrepancy.third_corrector = corrector
        discrepancy.save()
        
        log_action(
            user=request.user,
            action='UPDATE',
            object_type='Discrepancy',
            object_id=discrepancy.id,
            details={'action': 'assign_third', 'corrector': corrector.id},
            request=request
        )
        
        return Response({'status': 'Third corrector assigned'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCoordinator])
    def resolve(self, request, pk=None):
        """Resolve discrepancy with final grade"""
        discrepancy = self.get_object()
        final_grade = request.data.get('final_grade')
        
        if not final_grade:
            return Response(
                {'error': 'Final grade required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        discrepancy.final_grade = final_grade
        discrepancy.resolved = True
        discrepancy.resolved_at = timezone.now()
        discrepancy.coordinator_note = request.data.get('note', '')
        discrepancy.save()
        
        log_action(
            user=request.user,
            action='RESOLVE_DISCREPANCY',
            object_type='Discrepancy',
            object_id=discrepancy.id,
            details={'final_grade': float(final_grade)},
            request=request
        )
        
        return Response({'status': 'Discrepancy resolved'})


# ========== DELIBERATION VIEWS ==========

class DeliberationViewSet(viewsets.ModelViewSet):
    """ViewSet for Deliberation"""
    queryset = Deliberation.objects.all().order_by('rank')
    serializer_class = DeliberationSerializer
    permission_classes = [IsAuthenticated, IsJuryMember]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['session', 'decision']
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsJuryMember])
    def ranking(self, request):
        """Get ranked candidates for deliberation"""
        session_id = request.query_params.get('session')
        
        if not session_id:
            return Response(
                {'error': 'Session ID required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate final scores for all candidates
        # This is a simplified version - real calculation would be more complex
        candidates = Candidate.objects.filter(
            exam_session_id=session_id,
            status='PRESENT'
        )
        
        ranking = []
        for candidate in candidates:
            # Get all corrections for this candidate
            copies = Copy.objects.filter(anonymous_code__candidate=candidate)
            total_score = 0
            total_coeff = 0
            
            for copy in copies:
                # Get final grade (either from resolved discrepancy or average of corrections)
                if hasattr(copy, 'discrepancy') and copy.discrepancy.resolved:
                    grade = copy.discrepancy.final_grade
                else:
                    corrections = Correction.objects.filter(copy=copy)
                    if corrections.count() == 2:
                        grade = (corrections[0].grade + corrections[1].grade) / 2
                    elif corrections.count() == 1:
                        grade = corrections[0].grade
                    else:
                        continue
                
                total_score += float(grade) * float(copy.subject.coefficient)
                total_coeff += float(copy.subject.coefficient)
            
            if total_coeff > 0:
                final_score = total_score / total_coeff
                ranking.append({
                    'candidate_id': candidate.id,
                    'anonymous_code': candidate.anonymous_code.code if hasattr(candidate, 'anonymous_code') else None,
                    'final_score': round(final_score, 2)
                })
        
        # Sort by score descending
        ranking = sorted(ranking, key=lambda x: x['final_score'], reverse=True)
        
        # Add rank
        for i, item in enumerate(ranking, 1):
            item['rank'] = i
        
        return Response(ranking)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsJuryMember])
    def close_session(self, request):
        """Close deliberation session and publish results"""
        session_id = request.data.get('session_id')
        decisions = request.data.get('decisions', [])
        
        if not session_id or not decisions:
            return Response(
                {'error': 'Session ID and decisions required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            session = ExamSession.objects.get(id=session_id)
        except ExamSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        created = []
        for decision_data in decisions:
            deliberation, created_flag = Deliberation.objects.update_or_create(
                candidate_id=decision_data['candidate_id'],
                session_id=session_id,
                defaults={
                    'final_score': decision_data['final_score'],
                    'decision': decision_data['decision'],
                    'rank': decision_data.get('rank'),
                    'decided_by': request.user
                }
            )
            if created_flag:
                created.append(deliberation.id)
        
        # Update session status
        session.status = 'CLOSED'
        session.save()
        
        # Generate PV report
        pv = generate_pv_report(session, request.user)
        
        log_action(
            user=request.user,
            action='CLOSE_SESSION',
            object_type='ExamSession',
            object_id=session.id,
            details={'deliberations': len(created)},
            request=request
        )
        
        return Response({
            'status': 'Session closed',
            'deliberations_created': len(created),
            'pv_id': pv.id if pv else None
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def results(self, request):
        """Get final results (revealed identities after closure)"""
        session_id = request.query_params.get('session')
        
        if not session_id:
            return Response(
                {'error': 'Session ID required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only show identities if session is closed
        session = ExamSession.objects.get(id=session_id)
        if session.status != 'CLOSED':
            return Response(
                {'error': 'Results not available until session is closed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deliberations = Deliberation.objects.filter(
            session_id=session_id
        ).select_related('candidate').order_by('rank')
        
        results = []
        for d in deliberations:
            results.append({
                'rank': d.rank,
                'candidate_name': f"{d.candidate.last_name} {d.candidate.first_name}",
                'application_number': d.candidate.application_number,
                'final_score': d.final_score,
                'decision': d.decision
            })
        
        return Response(results)


# ========== PV REPORT VIEWS ==========

class PVReportViewSet(viewsets.ModelViewSet):
    """ViewSet for PV Reports"""
    queryset = PVReport.objects.all().order_by('-created_at')
    serializer_class = PVReportSerializer
    permission_classes = [IsAuthenticated, IsCoordinator]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['session', 'signed']
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsJuryMember])
    def generate(self, request):
        """Generate a new PV report"""
        session_id = request.data.get('session_id')
        title = request.data.get('title', f"PV Session {session_id}")
        
        if not session_id:
            return Response(
                {'error': 'Session ID required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            session = ExamSession.objects.get(id=session_id)
        except ExamSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generate PDF
        pv = generate_pv_report(session, request.user, title)
        
        log_action(
            user=request.user,
            action='CREATE',
            object_type='PVReport',
            object_id=pv.id,
            details={'title': title, 'session': session_id},
            request=request
        )
        
        serializer = self.get_serializer(pv)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsJuryMember])
    def sign(self, request, pk=None):
        """Sign a PV report"""
        pv = self.get_object()
        
        if pv.signed:
            return Response(
                {'error': 'PV already signed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add signer
        signers = pv.signers or []
        signers.append({
            'user_id': request.user.id,
            'name': f"{request.user.first_name} {request.user.last_name}",
            'role': request.user.profile.role,
            'signed_at': timezone.now().isoformat()
        })
        
        pv.signers = signers
        pv.signed = True  # In real app, would require multiple signatures
        pv.save()
        
        log_action(
            user=request.user,
            action='SIGN_PV',
            object_type='PVReport',
            object_id=pv.id,
            details={'signer': request.user.id},
            request=request
        )
        
        return Response({'status': 'PV signed'})
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download PV PDF"""
        pv = self.get_object()
        file_path = pv.pdf_file.path
        
        if os.path.exists(file_path):
            return FileResponse(
                open(file_path, 'rb'),
                as_attachment=True,
                filename=f"PV_{pv.session.name}_{pv.created_at.date()}.pdf"
            )
        
        return Response(
            {'error': 'File not found'},
            status=status.HTTP_404_NOT_FOUND
        )


# ========== AUDIT LOG VIEWS ==========

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Audit Logs (read-only)"""
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user', 'action', 'object_type']
    search_fields = ['details']
    ordering_fields = ['timestamp']
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export audit logs to CSV"""
        queryset = self.filter_queryset(self.get_queryset())
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['Timestamp', 'User', 'Action', 'Object Type', 'Object ID', 'Details', 'IP Address'])
        
        # Write data
        for log in queryset[:1000]:  # Limit to 1000 rows
            writer.writerow([
                log.timestamp,
                log.user.username if log.user else 'System',
                log.action,
                log.object_type,
                log.object_id,
                json.dumps(log.details),
                log.ip_address
            ])
        
        response = Response(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="audit_logs.csv"'
        return response


# ========== DASHBOARD VIEWS ==========

class DashboardViewSet(viewsets.ViewSet):
    """Dashboard statistics"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard statistics"""
        user = request.user
        role = user.profile.role
        
        stats = {}
        
        # Common stats
        active_session = ExamSession.objects.filter(status='ACTIVE').first()
        stats['active_session'] = ExamSessionSerializer(active_session).data if active_session else None
        
        # Role-specific stats
        if role in ['ADMIN', 'CFD_HEAD', 'COORDINATOR']:
            stats['total_candidates'] = Candidate.objects.count()
            stats['total_present'] = Attendance.objects.filter(present=True).count()
            stats['pending_corrections'] = Copy.objects.filter(
                subject__status='ACTIVE'
            ).exclude(
                corrections__attempt=2
            ).distinct().count()
            stats['active_discrepancies'] = Discrepancy.objects.filter(resolved=False).count()
            stats['subjects_by_status'] = Subject.objects.values('status').annotate(
                count=Count('id')
            )
            stats['recent_activities'] = AuditLogSerializer(
                AuditLog.objects.all()[:10], many=True
            ).data
        
        elif role == 'CORRECTOR':
            stats['assigned_copies'] = Copy.objects.filter(
                corrections__corrector=user
            ).count()
            stats['completed_corrections'] = Correction.objects.filter(
                corrector=user
            ).count()
        
        elif role == 'SUPERVISOR':
            if active_session:
                stats['today_attendance'] = Attendance.objects.filter(
                    session=active_session,
                    marked_at__date=timezone.now().date()
                ).count()
                stats['total_today'] = Candidate.objects.filter(
                    exam_session=active_session
                ).count()
        
        elif role == 'JURY_MEMBER':
            if active_session:
                stats['candidates_to_deliberate'] = Candidate.objects.filter(
                    exam_session=active_session,
                    status='PRESENT'
                ).count()
                stats[
                    'deliberation_completed'] = Deliberation.objects.filter(
                    session=active_session
                ).exists()
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def activity_feed(self, request):
        """Get recent activity feed"""
        logs = AuditLog.objects.all()[:20]
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)