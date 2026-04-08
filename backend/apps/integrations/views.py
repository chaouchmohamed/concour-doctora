from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CandidateImportBatch
from .permissions import CandidateImportPermission
from .serializers import CandidateImportBatchSerializer
from .services import create_import_batch, validate_import_payload


class CandidateImportEntryPointView(APIView):
    """SRS endpoint skeleton: /api/import/candidates/"""

    permission_classes = [IsAuthenticated, CandidateImportPermission]

    def post(self, request):
        payload = request.data if isinstance(request.data, list) else [request.data]
        summary = validate_import_payload(payload)
        batch = create_import_batch(source="API", initiated_by=request.user, summary=summary)
        return Response(CandidateImportBatchSerializer(batch).data, status=status.HTTP_202_ACCEPTED)


class CandidateImportBatchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CandidateImportBatch.objects.select_related("initiated_by").all().order_by("-created_at")
    serializer_class = CandidateImportBatchSerializer
    permission_classes = [IsAuthenticated, CandidateImportPermission]
