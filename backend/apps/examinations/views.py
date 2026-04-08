from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import ExamRoom, ExamSession, ExamSubject, SubjectSchedule
from .permissions import ExaminationAccessPermission
from .serializers import (
    ExamRoomSerializer,
    ExamSessionSerializer,
    ExamSubjectSerializer,
    SubjectScheduleSerializer,
)


class ExamSessionViewSet(viewsets.ModelViewSet):
    queryset = ExamSession.objects.all().order_by("id")
    serializer_class = ExamSessionSerializer
    permission_classes = [IsAuthenticated, ExaminationAccessPermission]


class ExamSubjectViewSet(viewsets.ModelViewSet):
    queryset = ExamSubject.objects.select_related("exam_session").all().order_by("id")
    serializer_class = ExamSubjectSerializer
    permission_classes = [IsAuthenticated, ExaminationAccessPermission]


class ExamRoomViewSet(viewsets.ModelViewSet):
    queryset = ExamRoom.objects.select_related("exam_session").all().order_by("id")
    serializer_class = ExamRoomSerializer
    permission_classes = [IsAuthenticated, ExaminationAccessPermission]


class SubjectScheduleViewSet(viewsets.ModelViewSet):
    queryset = SubjectSchedule.objects.select_related("subject", "room").all().order_by("id")
    serializer_class = SubjectScheduleSerializer
    permission_classes = [IsAuthenticated, ExaminationAccessPermission]
