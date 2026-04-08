from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import NotificationOutbox
from .permissions import NotificationAdminOnlyPermission
from .serializers import NotificationOutboxSerializer


class NotificationOutboxViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = NotificationOutbox.objects.all().order_by("-created_at")
    serializer_class = NotificationOutboxSerializer
    permission_classes = [IsAuthenticated, NotificationAdminOnlyPermission]
