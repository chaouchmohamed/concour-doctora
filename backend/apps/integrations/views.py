from rest_framework import status, viewsets
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
    """Import candidate rows from JSON payload and persist valid entries."""

    permission_classes = [IsAuthenticated, CandidateImportPermission]

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
    """Import candidates from an uploaded CSV or XLSX file."""

    permission_classes = [IsAuthenticated, CandidateImportPermission]
    parser_classes = [MultiPartParser]

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
    queryset = CandidateImportBatch.objects.select_related("initiated_by").all().order_by("-created_at")
    serializer_class = CandidateImportBatchSerializer
    permission_classes = [IsAuthenticated, CandidateImportPermission]
