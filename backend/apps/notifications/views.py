from django.db.models import Exists, OuterRef
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.candidates.models import Candidate, CandidateStatus

from .models import NotificationOutbox, NotificationStatus
from .permissions import NotificationAdminOnlyPermission
from .serializers import NotificationOutboxSerializer
from .tasks import send_convocation_email_task


class DispatchConvocationsView(APIView):
    permission_classes = [IsAuthenticated, NotificationAdminOnlyPermission]
    serializer_class = NotificationOutboxSerializer

    @extend_schema(
        summary="Dispatch convocation emails",
        description="Enqueues Celery tasks to send emails to all REGISTERED candidates without an existing outbox record.",
        responses={
            202: inline_serializer(
                name="DispatchResponse", fields={"detail": serializers.CharField()}
            )
        },
    )
    def post(self, request):
        active_outbox = NotificationOutbox.objects.filter(
            recipient=OuterRef("email"),
            status__in=[NotificationStatus.PENDING, NotificationStatus.SENT],
        )

        candidates = (
            Candidate.objects.filter(status=CandidateStatus.REGISTERED)
            .annotate(has_email=Exists(active_outbox))
            .filter(has_email=False)
        )

        enqueued_count = 0
        for candidate in candidates:
            send_convocation_email_task.delay(candidate.id)
            enqueued_count += 1

        return Response(
            {"detail": f"Dispatched {enqueued_count} convocation emails."},
            status=status.HTTP_202_ACCEPTED,
        )


class NotificationOutboxViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    queryset = NotificationOutbox.objects.all().order_by("-created_at")
    serializer_class = NotificationOutboxSerializer
    permission_classes = [IsAuthenticated, NotificationAdminOnlyPermission]
