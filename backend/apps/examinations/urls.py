from rest_framework.routers import DefaultRouter

from .views import ExamRoomViewSet, ExamSessionViewSet, ExamSubjectViewSet, SubjectScheduleViewSet

router = DefaultRouter()
router.register(r"sessions", ExamSessionViewSet, basename="exam-session")
router.register(r"subjects", ExamSubjectViewSet, basename="exam-subject")
router.register(r"rooms", ExamRoomViewSet, basename="exam-room")
router.register(r"schedules", SubjectScheduleViewSet, basename="subject-schedule")

urlpatterns = router.urls
