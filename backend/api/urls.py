"""
API URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

# Create router
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'sessions', ExamSessionViewSet, basename='session')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'candidates', CandidateViewSet, basename='candidate')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'copies', CopyViewSet, basename='copy')
router.register(r'corrections', CorrectionViewSet, basename='correction')
router.register(r'discrepancies', DiscrepancyViewSet, basename='discrepancy')
router.register(r'deliberation', DeliberationViewSet, basename='deliberation')
router.register(r'pv', PVReportViewSet, basename='pv')
router.register(r'audit-logs', AuditLogViewSet, basename='auditlog')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]