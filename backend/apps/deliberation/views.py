from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from apps.accounts.models import RoleChoices
from apps.audit.services import log_action

from .models import DeliberationResult, DeliberationRun, DeliberationStatus
from .permissions import DeliberationAccessPermission
from .serializers import DeliberationResultSerializer, DeliberationRunSerializer


def _request_ip(request) -> str | None:
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class DeliberationRunViewSet(viewsets.ModelViewSet):
    queryset = DeliberationRun.objects.select_related("closed_by").all().order_by("id")
    serializer_class = DeliberationRunSerializer
    permission_classes = [IsAuthenticated, DeliberationAccessPermission]
    http_method_names = ["get", "post", "head", "options"]

    @action(detail=True, methods=["post"], url_path="close")
    def close_deliberation(self, request, pk=None):
        deliberation = self.get_object()
        user = request.user

        if user.role not in {RoleChoices.ADMIN, RoleChoices.JURY_PRESIDENT}:
            return Response(
                {"detail": "Only ADMIN or JURY_PRESIDENT can close deliberation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if deliberation.status == DeliberationStatus.CLOSED:
            return Response(
                {"detail": "Deliberation is already closed and cannot be reopened from API."},
                status=status.HTTP_409_CONFLICT,
            )

        # TODO: enforce prerequisites: all subjects validated and grades locked.
        # TODO: trigger internal anonymity lifting process here (Celery workflow).
        deliberation.status = DeliberationStatus.CLOSED
        deliberation.closed_at = timezone.now()
        deliberation.closed_by = user
        deliberation.save(update_fields=["status", "closed_at", "closed_by", "updated_at"])

        log_action(
            user=user,
            role=user.role,
            ip_address=_request_ip(request),
            action_type="DELIBERATION_CLOSED",
            affected_object_type="DeliberationRun",
            affected_object_id=deliberation.id,
            details={
                "exam_session_id": deliberation.exam_session_id,
                "status": deliberation.status,
            },
        )

        return Response(self.get_serializer(deliberation).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="reopen")
    def reopen_deliberation(self, request, pk=None):
        """
        Admin-only emergency endpoint.
        This is intentionally explicit and audited because it reopens a closed deliberation.
        """
        deliberation = self.get_object()
        user = request.user

        if user.role != RoleChoices.ADMIN:
            return Response(
                {"detail": "Only ADMIN can reopen a deliberation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if deliberation.status == DeliberationStatus.OPEN:
            return Response(
                {"detail": "Deliberation is already open."},
                status=status.HTTP_409_CONFLICT,
            )

        reason = str(request.data.get("reason", "")).strip()
        if not reason:
            return Response(
                {"detail": "A non-empty 'reason' field is required for reopening."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        previous_closed_at = deliberation.closed_at.isoformat() if deliberation.closed_at else None
        previous_closed_by = deliberation.closed_by_id

        deliberation.status = DeliberationStatus.OPEN
        deliberation.closed_at = None
        deliberation.closed_by = None
        deliberation.save(update_fields=["status", "closed_at", "closed_by", "updated_at"])

        log_action(
            user=user,
            role=user.role,
            ip_address=_request_ip(request),
            action_type="DELIBERATION_REOPENED",
            affected_object_type="DeliberationRun",
            affected_object_id=deliberation.id,
            details={
                "reason": reason,
                "exam_session_id": deliberation.exam_session_id,
                "previous_closed_at": previous_closed_at,
                "previous_closed_by_user_id": previous_closed_by,
                "status": deliberation.status,
            },
        )

        # TODO: add operational workflow safeguards once deliberation engine is implemented
        # (e.g., recalculate ranking snapshots, regenerate provisional exports).
        return Response(self.get_serializer(deliberation).data, status=status.HTTP_200_OK)


class DeliberationResultViewSet(viewsets.ModelViewSet):
    queryset = DeliberationResult.objects.select_related("deliberation").all().order_by("rank", "id")
    serializer_class = DeliberationResultSerializer
    permission_classes = [IsAuthenticated, DeliberationAccessPermission]
    http_method_names = ["get", "post", "head", "options"]
