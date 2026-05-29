from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import PVDocument, PVSignature
from .permissions import PVAccessPermission
from .serializers import PVDocumentSerializer, PVSignatureSerializer


class PVDocumentViewSet(viewsets.ModelViewSet):
    queryset = PVDocument.objects.select_related("generated_by").all().order_by("-generated_at")
    serializer_class = PVDocumentSerializer
    permission_classes = [IsAuthenticated, PVAccessPermission]


class PVSignatureViewSet(viewsets.ModelViewSet):
    queryset = PVSignature.objects.select_related("pv_document", "signer_user").all().order_by("id")
    serializer_class = PVSignatureSerializer
    permission_classes = [IsAuthenticated, PVAccessPermission]
