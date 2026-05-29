from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status, viewsets
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CandidateImportBatch
from .parsers import parse_candidate_file
from .permissions import CandidateImportPermission
from .serializers import CandidateFileImportSerializer, CandidateImportBatchSerializer
from .services import process_candidate_import


class CandidateImportEntryPointView(APIView):
    permission_classes = [IsAuthenticated, CandidateImportPermission]

    @extend_schema(
        summary="Import candidates from JSON payload",
        description="Accepts a single candidate object or an array. Validates each row, imports valid ones, returns per-row errors.",
        request=inline_serializer(
            "CandidateImportRow",
            fields={
                "first_name": serializers.CharField(),
                "last_name": serializers.CharField(),
                "national_id": serializers.CharField(),
                "email": serializers.EmailField(),
                "phone": serializers.CharField(),
                "application_number": serializers.CharField(),
            },
        ),
        responses={202: CandidateImportBatchSerializer},
    )
    def post(self, request):
        payload = request.data if isinstance(request.data, list) else [request.data]
        batch, summary = process_candidate_import(
            payload=payload,
            initiated_by=request.user,
            source="API",
        )

        response_data = CandidateImportBatchSerializer(batch).data
        response_data["report"] = {
            "total": summary["total"],
            "validated_rows": summary["validated_rows"],
            "imported_rows": summary["valid"],
            "invalid_rows": summary["invalid"],
            "status": summary["status"],
            "errors": summary["errors"],
        }
        return Response(response_data, status=status.HTTP_202_ACCEPTED)


def _build_import_response(batch, summary):
    """Shared response builder for all import endpoints."""
    response_data = CandidateImportBatchSerializer(batch).data
    response_data["report"] = {
        "total": summary["total"],
        "validated_rows": summary["validated_rows"],
        "imported_rows": summary["valid"],
        "invalid_rows": summary["invalid"],
        "status": summary["status"],
        "errors": summary["errors"],
    }
    return response_data


class CandidateFileImportView(APIView):
    permission_classes = [IsAuthenticated, CandidateImportPermission]
    parser_classes = [MultiPartParser]

    @extend_schema(
        summary="Import candidates from CSV or XLSX file",
        description="Upload a .csv or .xlsx file with headers: first_name, last_name, national_id, email, phone, application_number.",
        request=CandidateFileImportSerializer,
        responses={202: CandidateImportBatchSerializer, 400: None},
    )
    def post(self, request):
        serializer = CandidateFileImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data["file"]
        rows, source = parse_candidate_file(uploaded_file, uploaded_file.name)

        if not rows:
            return Response(
                {"detail": "File contains no data rows."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        batch, summary = process_candidate_import(
            payload=rows,
            initiated_by=request.user,
            source=source,
        )

        return Response(
            _build_import_response(batch, summary),
            status=status.HTTP_202_ACCEPTED,
        )


class CandidateImportBatchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        CandidateImportBatch.objects.select_related("initiated_by")
        .all()
        .order_by("-created_at")
    )
    serializer_class = CandidateImportBatchSerializer
    permission_classes = [IsAuthenticated, CandidateImportPermission]
