from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import AuditLog
from .permissions import AuditAdminOnlyPermission
from .serializers import AuditLogSerializer


class AuditLogViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = AuditLog.objects.select_related("user").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, AuditAdminOnlyPermission]
