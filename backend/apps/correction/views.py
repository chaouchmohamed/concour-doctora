from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import CorrectionAssignment, CopyGrade, GradeDiscrepancy, SubjectGradeLock
from .permissions import CorrectionAccessPermission
from .serializers import (
    CopyGradeSerializer,
    CorrectionAssignmentSerializer,
    GradeDiscrepancySerializer,
    SubjectGradeLockSerializer,
)


class CorrectionAssignmentViewSet(viewsets.ModelViewSet):
    queryset = CorrectionAssignment.objects.select_related("corrector").all().order_by("id")
    serializer_class = CorrectionAssignmentSerializer
    permission_classes = [IsAuthenticated, CorrectionAccessPermission]


class CopyGradeViewSet(viewsets.ModelViewSet):
    queryset = CopyGrade.objects.select_related("corrector").all().order_by("id")
    serializer_class = CopyGradeSerializer
    permission_classes = [IsAuthenticated, CorrectionAccessPermission]
    http_method_names = ["get", "post", "head", "options"]


class GradeDiscrepancyViewSet(viewsets.ModelViewSet):
    queryset = GradeDiscrepancy.objects.all().order_by("-created_at")
    serializer_class = GradeDiscrepancySerializer
    permission_classes = [IsAuthenticated, CorrectionAccessPermission]


class SubjectGradeLockViewSet(viewsets.ModelViewSet):
    queryset = SubjectGradeLock.objects.select_related("locked_by").all().order_by("id")
    serializer_class = SubjectGradeLockSerializer
    permission_classes = [IsAuthenticated, CorrectionAccessPermission]
    http_method_names = ["get", "post", "head", "options"]
