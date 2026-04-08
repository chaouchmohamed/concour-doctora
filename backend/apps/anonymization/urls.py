from rest_framework.routers import DefaultRouter

from .views import AnonymousCodeViewSet, ExamCopyViewSet

router = DefaultRouter()
router.register(r"codes", AnonymousCodeViewSet, basename="anonymous-code")
router.register(r"copies", ExamCopyViewSet, basename="exam-copy")

urlpatterns = router.urls
