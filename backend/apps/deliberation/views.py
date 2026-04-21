from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import RoleChoices
from apps.audit.services import log_action

from .models import DeliberationResult, DeliberationRun, DeliberationStatus
from .permissions import DeliberationAccessPermission, JuryPresidentOrAdminPermission
from .serializers import (
    ArchiveDeliberationSerializer,
    CloseDeliberationSerializer,
    ComputeDeliberationSerializer,
    DeliberationResultSerializer,
    DeliberationRunSerializer,
    GenerateDeliberationPVSerializer,
    SignPVSerializer,
)
from .services import (
    archive_deliberation,
    close_deliberation,
    compute_deliberation_results,
    generate_deliberation_pv,
    sign_pv,
)


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

    @extend_schema(
        summary="Compute deliberation results",
        description="Computes weighted averages, ranks, and admissibility outcomes "
        "for all copies in a session. Requires all subjects to be locked.",
        request=ComputeDeliberationSerializer,
        responses={200: None},
    )
    @action(
        detail=True,
        methods=["post"],
        url_path="compute",
        permission_classes=[IsAuthenticated, JuryPresidentOrAdminPermission],
    )
    def compute(self, request, pk=None):
        deliberation = self.get_object()
        if deliberation.is_archived:
            return Response(
                {"detail": "Archived deliberations cannot be recomputed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            result = compute_deliberation_results(
                session_id=deliberation.exam_session_id,
                user=request.user,
            )
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Close deliberation",
        description="Closes deliberation. Prerequisites: results computed. "
        "Triggers anonymity lifting (candidate identities revealed). Irreversible except via reopen.",
        request=CloseDeliberationSerializer,
        responses={200: DeliberationRunSerializer},
    )
    @action(
        detail=True,
        methods=["post"],
        url_path="close",
        permission_classes=[IsAuthenticated, JuryPresidentOrAdminPermission],
    )
    def close_deliberation(self, request, pk=None):
        deliberation = self.get_object()
        try:
            deliberation = close_deliberation(
                deliberation_id=deliberation.pk,
                user=request.user,
            )
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        log_action(
            user=request.user,
            role=request.user.role,
            ip_address=_request_ip(request),
            action_type="DELIBERATION_CLOSED",
            affected_object_type="DeliberationRun",
            affected_object_id=deliberation.id,
            details={
                "exam_session_id": deliberation.exam_session_id,
                "status": deliberation.status,
            },
        )

        return Response(
            DeliberationRunSerializer(deliberation).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Reopen deliberation (admin only)",
        description="Admin-only emergency endpoint. Requires 'reason' in request body.",
        request=None,
        responses={200: DeliberationRunSerializer},
    )
    @action(detail=True, methods=["post"], url_path="reopen")
    def reopen_deliberation(self, request, pk=None):
        deliberation = self.get_object()
        user = request.user

        if user.role != RoleChoices.ADMIN:
            return Response(
                {"detail": "Only ADMIN can reopen a deliberation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if deliberation.is_archived:
            return Response(
                {"detail": "Archived deliberations cannot be reopened."},
                status=status.HTTP_400_BAD_REQUEST,
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

        previous_closed_at = (
            deliberation.closed_at.isoformat() if deliberation.closed_at else None
        )
        previous_closed_by = deliberation.closed_by_id

        deliberation.status = DeliberationStatus.OPEN
        deliberation.closed_at = None
        deliberation.closed_by = None
        deliberation.save(
            update_fields=["status", "closed_at", "closed_by", "updated_at"]
        )

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

        return Response(
            DeliberationRunSerializer(deliberation).data, status=status.HTTP_200_OK
        )

    @extend_schema(
        summary="Generate PV of Deliberation",
        description="Generates PV after deliberation is closed. Lists all results with identities.",
        request=GenerateDeliberationPVSerializer,
        responses={200: None},
    )
    @action(
        detail=True,
        methods=["post"],
        url_path="generate-pv",
        permission_classes=[IsAuthenticated, JuryPresidentOrAdminPermission],
    )
    def generate_pv(self, request, pk=None):
        deliberation = self.get_object()
        try:
            pv = generate_deliberation_pv(
                deliberation_id=deliberation.pk,
                user=request.user,
            )
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

    @extend_schema(
        summary="Archive deliberation",
        description="Archives a closed deliberation. Makes it immutable (no reopen).",
        request=ArchiveDeliberationSerializer,
        responses={200: DeliberationRunSerializer},
    )
    @action(
        detail=True,
        methods=["post"],
        url_path="archive",
        permission_classes=[IsAuthenticated, JuryPresidentOrAdminPermission],
    )
    def archive_deliberation(self, request, pk=None):
        deliberation = self.get_object()
        try:
            deliberation = archive_deliberation(
                deliberation_id=deliberation.pk,
                user=request.user,
            )
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            DeliberationRunSerializer(deliberation).data,
            status=status.HTTP_200_OK,
        )


class DeliberationResultViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        DeliberationResult.objects.select_related("deliberation")
        .all()
        .order_by("rank", "id")
    )
    serializer_class = DeliberationResultSerializer
    permission_classes = [IsAuthenticated, DeliberationAccessPermission]


class SignDeliberationPVView(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, DeliberationAccessPermission]
    serializer_class = SignPVSerializer

    @extend_schema(
        summary="Sign a deliberation PV",
        description="JURY_PRESIDENT, JURY_MEMBER, or ADMIN signs a deliberation PV. "
        "Each user can sign only once per PV.",
        request=SignPVSerializer,
        responses={201: None},
    )
    def create(self, request):
        serializer = SignPVSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            signature = sign_pv(
                pv_document_id=serializer.validated_data["pv_document_id"],
                signer_user=request.user,
            )
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "id": signature.id,
                "pv_document": signature.pv_document_id,
                "signer_name": signature.signer_name,
                "signed_at": signature.signed_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )
