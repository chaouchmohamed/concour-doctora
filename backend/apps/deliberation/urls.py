from rest_framework.routers import DefaultRouter

from .views import (
    DeliberationResultViewSet,
    DeliberationRunViewSet,
    SignDeliberationPVView,
)

router = DefaultRouter()
router.register(r"runs", DeliberationRunViewSet, basename="deliberation-run")
router.register(r"results", DeliberationResultViewSet, basename="deliberation-result")
router.register(r"sign-pv", SignDeliberationPVView, basename="sign-deliberation-pv")

urlpatterns = router.urls
