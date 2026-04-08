from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import AttendanceRecord, AttendanceSubmission
from .permissions import AttendanceAccessPermission
from .serializers import AttendanceRecordSerializer, AttendanceSubmissionSerializer


class AttendanceSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AttendanceSubmission.objects.all().order_by("id")
    serializer_class = AttendanceSubmissionSerializer
    permission_classes = [IsAuthenticated, AttendanceAccessPermission]


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.select_related("submission").all().order_by("id")
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated, AttendanceAccessPermission]
