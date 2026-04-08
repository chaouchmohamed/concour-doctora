from rest_framework.routers import DefaultRouter

from .views import (
    CopyGradeViewSet,
    CorrectionAssignmentViewSet,
    GradeDiscrepancyViewSet,
    SubjectGradeLockViewSet,
)

router = DefaultRouter()
router.register(r"assignments", CorrectionAssignmentViewSet, basename="correction-assignment")
router.register(r"grades", CopyGradeViewSet, basename="copy-grade")
router.register(r"discrepancies", GradeDiscrepancyViewSet, basename="grade-discrepancy")
router.register(r"locks", SubjectGradeLockViewSet, basename="subject-grade-lock")

urlpatterns = router.urls
