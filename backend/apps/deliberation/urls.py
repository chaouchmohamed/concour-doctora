from rest_framework.routers import DefaultRouter

from .views import DeliberationResultViewSet, DeliberationRunViewSet

router = DefaultRouter()
router.register(r"runs", DeliberationRunViewSet, basename="deliberation-run")
router.register(r"results", DeliberationResultViewSet, basename="deliberation-result")

urlpatterns = router.urls
