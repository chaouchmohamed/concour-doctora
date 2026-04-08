from rest_framework.routers import DefaultRouter

from .views import AttendanceRecordViewSet, AttendanceSubmissionViewSet

router = DefaultRouter()
router.register(r"submissions", AttendanceSubmissionViewSet, basename="attendance-submission")
router.register(r"records", AttendanceRecordViewSet, basename="attendance-record")

urlpatterns = router.urls
