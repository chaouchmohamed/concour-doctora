from django.core.files.base import ContentFile
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ExamAllocation, ExamRoom, ExamSession, ExamSubject, SubjectSchedule
from .permissions import (
    CallListAccessPermission,
    ExaminationAccessPermission,
    LotteryAccessPermission,
)
from .serializers import (
    AutoAllocateResultSerializer,
    CallListBlockSerializer,
    CallListEntrySerializer,
    ExamAllocationSerializer,
    ExamRoomSerializer,
    ExamSessionSerializer,
    ExamSubjectSerializer,
    LotteryResultSerializer,
    PVResultSerializer,
    SubjectScheduleSerializer,
)
from .services import (
    auto_allocate_candidates,
    generate_call_list,
    generate_call_list_by_subject,
    generate_call_list_file,
    generate_call_list_file_by_subject,
    record_lottery_result,
    record_subjects_submission,
)


class ExamSessionViewSet(viewsets.ModelViewSet):
    queryset = ExamSession.objects.all().order_by("id")
    serializer_class = ExamSessionSerializer
    permission_classes = [IsAuthenticated, ExaminationAccessPermission]

    @extend_schema(
        summary="Record subjects submission and generate PV of Subject Creation",
        request=None,
        responses={200: PVResultSerializer},
    )
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, LotteryAccessPermission],
    )
    def record_subjects(self, request, pk=None):
        session = self.get_object()
        try:
            pv = record_subjects_submission(session, request.user)
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "pv_document_id": pv.id,
                "pv_document_identifier": pv.document_identifier,
                "pv_type": pv.pv_type,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Record lottery result and generate PV of Subject Lottery",
        request=LotteryResultSerializer,
        responses={200: PVResultSerializer},
    )
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, LotteryAccessPermission],
    )
    def lottery(self, request, pk=None):
        session = self.get_object()
        serializer = LotteryResultSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            subject = ExamSubject.objects.get(
                id=serializer.validated_data["selected_subject_id"],
                exam_session=session,
            )
        except ExamSubject.DoesNotExist:
            return Response(
                {"detail": "Selected subject not found in this session."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            pv = record_lottery_result(session, subject, request.user)
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "pv_document_id": pv.id,
                "pv_document_identifier": pv.document_identifier,
                "pv_type": pv.pv_type,
                "selected_subject": subject.name,
            },
            status=status.HTTP_200_OK,
        )


class ExamSubjectViewSet(viewsets.ModelViewSet):
    queryset = ExamSubject.objects.select_related("exam_session").all().order_by("id")
    serializer_class = ExamSubjectSerializer
    permission_classes = [IsAuthenticated, ExaminationAccessPermission]

    @extend_schema(
        summary="Consolidated call list for a subject (all rooms)",
        responses={200: CallListBlockSerializer(many=True)},
    )
    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAuthenticated, CallListAccessPermission],
    )
    def call_list(self, request, pk=None):
        subject = self.get_object()
        data = generate_call_list_by_subject(subject)
        return Response(data)


class ExamRoomViewSet(viewsets.ModelViewSet):
    queryset = ExamRoom.objects.select_related("exam_session").all().order_by("id")
    serializer_class = ExamRoomSerializer
    permission_classes = [IsAuthenticated, ExaminationAccessPermission]


class SubjectScheduleViewSet(viewsets.ModelViewSet):
    queryset = (
        SubjectSchedule.objects.select_related("subject", "room").all().order_by("id")
    )
    serializer_class = SubjectScheduleSerializer
    permission_classes = [IsAuthenticated, ExaminationAccessPermission]

    @extend_schema(
        summary="Auto-allocate candidates to rooms and seats",
        description="Randomly distributes all registered candidates across rooms for this schedule. "
        "Re-running reshuffles all allocations.",
        responses={200: AutoAllocateResultSerializer},
    )
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, ExaminationAccessPermission],
    )
    def auto_allocate(self, request, pk=None):
        schedule = self.get_object()
        try:
            result = auto_allocate_candidates(schedule, request.user)
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Call list for this schedule (per room)",
        responses={200: CallListEntrySerializer(many=True)},
    )
    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAuthenticated, CallListAccessPermission],
    )
    def call_list(self, request, pk=None):
        schedule = self.get_object()
        data = generate_call_list(schedule)
        return Response(data)


class ExamAllocationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        ExamAllocation.objects.select_related("candidate", "subject_schedule")
        .all()
        .order_by("id")
    )
    serializer_class = ExamAllocationSerializer
    permission_classes = [IsAuthenticated, ExaminationAccessPermission]
