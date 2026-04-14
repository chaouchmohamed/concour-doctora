from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import RoleChoices

from .models import AnonymousCode, ExamCopy
from .permissions import (
    AnonymousCodeAccessPermission,
    AnonymizationWritePermission,
    ExamCopyAccessPermission,
)
from .serializers import (
    AnonymousCodeAdminSerializer,
    AnonymousCodeSerializer,
    CodingProgressSerializer,
    ExamCopyAdminSerializer,
    ExamCopySerializer,
    UploadCopyAndCodeSerializer,
)
from .services import (
    generate_anonymization_pv,
    get_session_coding_progress,
    upload_and_code_copy,
)


class UploadCopyAndCodeView(APIView):
    permission_classes = [IsAuthenticated, AnonymizationWritePermission]
    parser_classes = [MultiPartParser]

    @extend_schema(
        summary="Upload exam copy and generate anonymous code",
        description="Anonymity Commission uploads a scanned copy and enters the candidate's "
        "application_number. The system generates a DOCT-YYYY-XXXX anonymous code, "
        "encrypts the candidate identity, and links the copy to the code.",
        request=UploadCopyAndCodeSerializer,
        responses={201: ExamCopySerializer},
    )
    def post(self, request):
        serializer = UploadCopyAndCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            exam_copy = upload_and_code_copy(
                session_id=serializer.validated_data["session_id"],
                application_number=serializer.validated_data["application_number"],
                uploaded_file=serializer.validated_data["file"],
                user=request.user,
            )
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            ExamCopySerializer(exam_copy).data,
            status=status.HTTP_201_CREATED,
        )


class AnonymousCodeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AnonymousCode.objects.all().order_by("id")
    permission_classes = [IsAuthenticated, AnonymousCodeAccessPermission]

    def get_serializer_class(self):
        user = self.request.user
        if user.role == "ADMIN":
            return AnonymousCodeAdminSerializer
        return AnonymousCodeSerializer


class ExamCopyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExamCopy.objects.select_related("anonymous_code").all().order_by("id")
    permission_classes = [IsAuthenticated, ExamCopyAccessPermission]

    def get_serializer_class(self):
        user = self.request.user
        if user.role == "ADMIN":
            return ExamCopyAdminSerializer
        return ExamCopySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == RoleChoices.CORRECTOR:
            from apps.correction.models import CorrectionAssignment

            try:
                assigned_codes = CorrectionAssignment.objects.filter(
                    corrector=user
                ).values_list("anonymous_code", flat=True)
                qs = qs.filter(anonymous_code__code__in=list(assigned_codes))
            except Exception:
                qs = qs.none()
        return qs

    @extend_schema(
        summary="Coding progress for an exam session",
        description="Returns how many present candidates, codes generated, and copies uploaded for a session.",
        responses={200: CodingProgressSerializer},
    )
    @action(detail=False, methods=["get"], url_path="progress/(?P<session_id>[^/.]+)")
    def progress(self, request, session_id=None):
        data = get_session_coding_progress(int(session_id))
        return Response(data)

    @extend_schema(
        summary="Generate PV of Anonymization",
        description="Generates the PV once all present candidates have been coded and copies uploaded.",
        responses={200: None, 400: None},
    )
    @action(
        detail=False, methods=["post"], url_path="generate-pv/(?P<session_id>[^/.]+)"
    )
    def generate_pv(self, request, session_id=None):
        try:
            pv = generate_anonymization_pv(int(session_id), request.user)
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
