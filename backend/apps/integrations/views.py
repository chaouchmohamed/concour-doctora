from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CandidateImportBatch
from .permissions import CandidateImportPermission
from .serializers import CandidateImportBatchSerializer
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


class CandidateImportBatchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CandidateImportBatch.objects.select_related("initiated_by").all().order_by("-created_at")
    serializer_class = CandidateImportBatchSerializer
    permission_classes = [IsAuthenticated, CandidateImportPermission]
