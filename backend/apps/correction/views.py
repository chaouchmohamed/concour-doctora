from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import RoleChoices

from .models import CorrectionAssignment, CopyGrade, GradeDiscrepancy, SubjectGradeLock
from .permissions import (
    CoordinatorOrAdminPermission,
    CorrectionAccessPermission,
    CorrectorOnlyPermission,
)
from .serializers import (
    AssignResultSerializer,
    AssignThirdCorrectorSerializer,
    ComputeFinalGradesResultSerializer,
    ComputeFinalGradesSerializer,
    CorrectionAssignmentCreateSerializer,
    CorrectionAssignmentReadSerializer,
    CorrectorCopySerializer,
    CopyGradeCreateSerializer,
    CopyGradeReadSerializer,
    CopyGradeSerializer,
    GenerateCorrectionPVSerializer,
    GradeDiscrepancySerializer,
    LockSubjectGradesSerializer,
    SubjectGradeLockSerializer,
)
from .services import (
    assign_correctors,
    assign_third_corrector,
    compute_final_grades,
    delete_assignments,
    generate_correction_pv,
    get_corrector_assignments,
    get_corrector_copies,
    lock_subject_grades,
    submit_grade,
)


class CorrectionAssignmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        CorrectionAssignment.objects.select_related("corrector").all().order_by("id")
    )
    serializer_class = CorrectionAssignmentReadSerializer
    permission_classes = [IsAuthenticated, CorrectionAccessPermission]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == RoleChoices.CORRECTOR:
            qs = qs.filter(corrector=user)
        subject_id = self.request.query_params.get("subject_id")
        if subject_id:
            qs = qs.filter(exam_subject_id=int(subject_id))
        return qs

    @extend_schema(
        summary="Assign correctors to all copies for a subject",
        description="Assigns exactly 2 correctors per anonymous copy for a given subject. "
        "Requires COORDINATOR or ADMIN role. At least 2 active CORRECTOR users required.",
        request=CorrectionAssignmentCreateSerializer,
        responses={201: AssignResultSerializer},
    )
    @action(
        detail=False,
        methods=["post"],
        url_path="assign",
        permission_classes=[IsAuthenticated, CoordinatorOrAdminPermission],
    )
    def assign(self, request):
        serializer = CorrectionAssignmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = assign_correctors(
                subject_id=serializer.validated_data["subject_id"],
                corrector_ids=serializer.validated_data["corrector_ids"],
                user=request.user,
            )
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_201_CREATED)

    @extend_schema(
        summary="Delete all corrector assignments for a subject",
        description="Removes all CorrectionAssignment records for a subject. "
        "Blocked if grades already exist for the subject.",
        request=None,
        responses={200: None},
    )
    @action(
        detail=False,
        methods=["delete"],
        url_path="delete-subject",
        permission_classes=[IsAuthenticated, CoordinatorOrAdminPermission],
    )
    def delete_subject_assignments(self, request):
        subject_id = request.query_params.get("subject_id")
        if not subject_id:
            return Response(
                {"detail": "subject_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            result = delete_assignments(int(subject_id), request.user)
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)


class CorrectorCopyListView(APIView):
    permission_classes = [IsAuthenticated, CorrectorOnlyPermission]
    serializer_class = CorrectorCopySerializer

    @extend_schema(
        summary="Get copies assigned to the requesting corrector",
        description="Returns a list of exam copies (with scan file URLs) assigned to the "
        "currently authenticated corrector. Optionally filter by subject_id.",
        responses={200: CorrectorCopySerializer(many=True)},
        parameters=[
            OpenApiParameter(
                name="subject_id",
                type=int,
                required=False,
                description="Filter copies by subject ID",
            ),
        ],
    )
    def get(self, request):
        subject_id = request.query_params.get("subject_id")
        subject_id = int(subject_id) if subject_id else None
        copies = get_corrector_copies(request.user, subject_id=subject_id)
        serializer = CorrectorCopySerializer(copies, many=True)
        return Response(serializer.data)


class CopyGradeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CopyGrade.objects.select_related("corrector").all().order_by("id")
    serializer_class = CopyGradeReadSerializer
    permission_classes = [IsAuthenticated, CorrectionAccessPermission]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == RoleChoices.CORRECTOR:
            qs = qs.filter(corrector=user)
        subject_id = self.request.query_params.get("subject_id")
        if subject_id:
            qs = qs.filter(exam_subject_id=int(subject_id))
        return qs

    @extend_schema(
        summary="Submit a grade for an anonymous copy",
        description="Corrector submits a grade. Validates: corrector is assigned, "
        "grade is within [0, max_score], subject not locked, no duplicate grade. "
        "Auto-detects discrepancy if both grades entered and difference > threshold.",
        request=CopyGradeCreateSerializer,
        responses={201: CopyGradeReadSerializer},
    )
    @action(detail=False, methods=["post"], url_path="submit")
    def submit(self, request):
        serializer = CopyGradeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            grade = submit_grade(
                anonymous_code=serializer.validated_data["anonymous_code"],
                exam_subject_id=serializer.validated_data["exam_subject_id"],
                corrector=request.user,
                grade_value=serializer.validated_data["grade"],
            )
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            CopyGradeReadSerializer(grade).data,
            status=status.HTTP_201_CREATED,
        )


class GradeDiscrepancyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = GradeDiscrepancy.objects.all().order_by("-created_at")
    serializer_class = GradeDiscrepancySerializer
    permission_classes = [IsAuthenticated, CoordinatorOrAdminPermission]

    @extend_schema(
        summary="Assign a third corrector to resolve a discrepancy",
        description="Coordinator assigns a third corrector to an unresolved discrepancy. "
        "The third corrector can then submit a grade for arbitration.",
        request=AssignThirdCorrectorSerializer,
        responses={201: None},
    )
    @action(
        detail=True,
        methods=["post"],
        url_path="assign-third-corrector",
        permission_classes=[IsAuthenticated, CoordinatorOrAdminPermission],
    )
    def assign_third(self, request, pk=None):
        discrepancy = self.get_object()
        serializer = AssignThirdCorrectorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            assignment = assign_third_corrector(
                discrepancy_id=discrepancy.pk,
                third_corrector_id=serializer.validated_data["third_corrector_id"],
                user=request.user,
            )
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"detail": "Third corrector assigned.", "assignment_id": assignment.id},
            status=status.HTTP_201_CREATED,
        )


class SubjectGradeLockViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubjectGradeLock.objects.select_related("locked_by").all().order_by("id")
    serializer_class = SubjectGradeLockSerializer
    permission_classes = [IsAuthenticated, CoordinatorOrAdminPermission]

    @extend_schema(
        summary="Lock grades for a subject",
        description="Coordinator validates all grades and locks the subject. "
        "Prerequisites: all copies have final grades computed, no unresolved discrepancies. "
        "After locking, no grades can be submitted or modified.",
        request=LockSubjectGradesSerializer,
        responses={201: SubjectGradeLockSerializer},
    )
    @action(detail=False, methods=["post"], url_path="lock-subject")
    def lock_subject(self, request):
        serializer = LockSubjectGradesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            lock = lock_subject_grades(
                subject_id=serializer.validated_data["subject_id"],
                user=request.user,
            )
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            SubjectGradeLockSerializer(lock).data,
            status=status.HTTP_201_CREATED,
        )


class GenerateCorrectionPVView(APIView):
    permission_classes = [IsAuthenticated, CoordinatorOrAdminPermission]
    serializer_class = GenerateCorrectionPVSerializer

    @extend_schema(
        summary="Generate PV of Correction for a subject",
        description="Generates the PV of Correction once grades are locked. "
        "Lists all copies, grades, discrepancies, and final grades.",
        request=GenerateCorrectionPVSerializer,
        responses={200: None},
    )
    def post(self, request):
        serializer = GenerateCorrectionPVSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            pv = generate_correction_pv(
                subject_id=serializer.validated_data["subject_id"],
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


class ComputeFinalGradesView(APIView):
    permission_classes = [IsAuthenticated, CoordinatorOrAdminPermission]
    serializer_class = ComputeFinalGradesResultSerializer

    @extend_schema(
        summary="Compute final grades for a subject",
        description="Computes final grades for all copies in a subject based on the "
        "subject's final_grade_rule (AVERAGE, MEDIAN, or THIRD_CORRECTOR). "
        "Requires all copies to have both initial grades. Unresolved discrepancies "
        "with THIRD_CORRECTOR rule require a third corrector grade first.",
        request=ComputeFinalGradesSerializer,
        responses={200: ComputeFinalGradesResultSerializer},
    )
    def post(self, request):
        serializer = ComputeFinalGradesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = compute_final_grades(
                subject_id=serializer.validated_data["subject_id"],
                user=request.user,
            )
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_200_OK)
