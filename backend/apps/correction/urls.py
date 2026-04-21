from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ComputeFinalGradesView,
    CorrectorCopyListView,
    CopyGradeViewSet,
    CorrectionAssignmentViewSet,
    GenerateCorrectionPVView,
    GradeDiscrepancyViewSet,
    SubjectGradeLockViewSet,
)

router = DefaultRouter()
router.register(
    r"assignments", CorrectionAssignmentViewSet, basename="correction-assignment"
)
router.register(r"grades", CopyGradeViewSet, basename="copy-grade")
router.register(r"discrepancies", GradeDiscrepancyViewSet, basename="grade-discrepancy")
router.register(r"locks", SubjectGradeLockViewSet, basename="subject-grade-lock")

urlpatterns = [
    path("my-copies/", CorrectorCopyListView.as_view(), name="corrector-copies"),
    path(
        "compute-final-grades/",
        ComputeFinalGradesView.as_view(),
        name="compute-final-grades",
    ),
    path(
        "generate-pv/",
        GenerateCorrectionPVView.as_view(),
        name="generate-correction-pv",
    ),
] + router.urls
