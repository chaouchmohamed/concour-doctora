from drf_spectacular.utils import extend_schema
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import AttendanceRecord, AttendanceSubmission
from .permissions import AttendanceAccessPermission
from .serializers import AttendanceRecordSerializer, AttendanceSubmissionSerializer
from .services import finalize_attendance


class AttendanceSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AttendanceSubmission.objects.all().order_by("id")
    serializer_class = AttendanceSubmissionSerializer
    permission_classes = [IsAuthenticated, AttendanceAccessPermission]

    @extend_schema(
        summary="Finalize attendance submission",
        description="Validates that all allocated candidates are marked and propagates ABSENT status to ELIMINATED.",
        responses={200: AttendanceSubmissionSerializer, 400: None},
    )
    @action(detail=True, methods=["post"])
    def finalize(self, request, pk=None):
        submission = self.get_object()
        try:
            submission = finalize_attendance(submission, request.user)
            return Response(self.get_serializer(submission).data, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.select_related("submission", "candidate").all().order_by("id")
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated, AttendanceAccessPermission]

    def _check_submission_finalized(self, submission):
        if submission.is_finalized:
            raise ValidationError({"detail": "Cannot modify records: the attendance submission is already finalized."})

    def perform_create(self, serializer):
        self._check_submission_finalized(serializer.validated_data["submission"])
        serializer.save(marked_by=self.request.user)

    def perform_update(self, serializer):
        # Prevent moving a record TO a finalized submission (should be covered if both are finalized, but just in case)
        if "submission" in serializer.validated_data:
            self._check_submission_finalized(serializer.validated_data["submission"])
        # Prevent moving a record FROM a finalized submission
        self._check_submission_finalized(self.get_object().submission)
        
        serializer.save()

    def perform_destroy(self, instance):
        self._check_submission_finalized(instance.submission)
        instance.delete()
