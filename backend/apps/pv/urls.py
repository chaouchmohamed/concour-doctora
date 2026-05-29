from rest_framework.routers import DefaultRouter

from .views import PVDocumentViewSet, PVSignatureViewSet

router = DefaultRouter()
router.register(r"documents", PVDocumentViewSet, basename="pv-document")
router.register(r"signatures", PVSignatureViewSet, basename="pv-signature")

urlpatterns = router.urls
