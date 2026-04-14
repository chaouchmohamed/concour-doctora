import csv
import io

from drf_spectacular.utils import extend_schema
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import AttendanceRecord, AttendanceSubmission
from .permissions import AttendanceAccessPermission
from .serializers import (
    AttendanceCounterSerializer,
    AttendanceCSVImportSerializer,
    AttendanceCSVImportResultSerializer,
    AttendanceFinalizeResponseSerializer,
    AttendanceRecordSerializer,
    AttendanceSubmissionSerializer,
)
from .services import (
    finalize_attendance,
    get_attendance_counter,
    import_attendance_csv,
    toggle_attendance_record,
    undo_attendance_record,
)


class AttendanceSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AttendanceSubmission.objects.all().order_by("id")
    serializer_class = AttendanceSubmissionSerializer
    permission_classes = [IsAuthenticated, AttendanceAccessPermission]

    @extend_schema(
        summary="Finalize attendance submission",
        description="Validates that all allocated candidates are marked, propagates ABSENT→ELIMINATED, and generates PV of Attendance.",
        request=None,
        responses={200: AttendanceFinalizeResponseSerializer, 400: None},
    )
    @action(detail=True, methods=["post"])
    def finalize(self, request, pk=None):
        submission = self.get_object()
        try:
            submission, pv = finalize_attendance(submission, request.user)
            return Response(
                {
                    "submission": self.get_serializer(submission).data,
                    "pv_document_id": pv.id,
                    "pv_document_identifier": pv.document_identifier,
                },
                status=status.HTTP_200_OK,
            )
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Attendance counter",
        description="Returns real-time counts of marked/unmarked/present/absent candidates for this submission.",
        responses={200: AttendanceCounterSerializer},
    )
    @action(detail=True, methods=["get"])
    def counter(self, request, pk=None):
        submission = self.get_object()
        data = get_attendance_counter(submission)
        return Response(data)

    @extend_schema(
        summary="Import attendance from CSV file",
        description="Bulk-import attendance records from a CSV file. Columns: application_number, status.",
        request=AttendanceCSVImportSerializer,
        responses={200: AttendanceCSVImportResultSerializer, 400: None},
    )
    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser])
    def import_csv(self, request, pk=None):
        submission = self.get_object()
        file_obj = request.data.get("file")
        if not file_obj:
            return Response(
                {"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            decoded = file_obj.read().decode("utf-8")
        except UnicodeDecodeError:
            return Response(
                {"detail": "File must be UTF-8 encoded CSV."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reader = csv.DictReader(io.StringIO(decoded))
        rows = list(reader)
        if not rows:
            return Response(
                {"detail": "CSV file is empty."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            result = import_attendance_csv(submission, rows, request.user)
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_200_OK)


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = (
        AttendanceRecord.objects.select_related("submission", "candidate")
        .all()
        .order_by("id")
    )
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated, AttendanceAccessPermission]

    def _check_submission_finalized(self, submission):
        if submission.is_finalized:
            raise ValidationError(
                {
                    "detail": "Cannot modify records: the attendance submission is already finalized."
                }
            )

    def perform_create(self, serializer):
        self._check_submission_finalized(serializer.validated_data["submission"])
        serializer.save(marked_by=self.request.user)

    def perform_update(self, serializer):
        if "submission" in serializer.validated_data:
            self._check_submission_finalized(serializer.validated_data["submission"])
        self._check_submission_finalized(self.get_object().submission)
        serializer.save()

    def perform_destroy(self, instance):
        self._check_submission_finalized(instance.submission)
        instance.delete()

    @extend_schema(
        summary="Undo attendance marking",
        description="Deletes the attendance record, reverting the candidate to unmarked state. Only allowed before finalization.",
        responses={204: None, 400: None},
    )
    @action(detail=True, methods=["post"])
    def undo(self, request, pk=None):
        record = self.get_object()
        try:
            undo_attendance_record(record, request.user)
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        summary="Toggle attendance status",
        description="Switches a record between PRESENT and ABSENT. Only allowed before finalization.",
        responses={200: AttendanceRecordSerializer, 400: None},
    )
    @action(detail=True, methods=["post"])
    def toggle(self, request, pk=None):
        record = self.get_object()
        try:
            record = toggle_attendance_record(record, request.user)
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(record).data, status=status.HTTP_200_OK)
