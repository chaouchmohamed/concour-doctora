from rest_framework.routers import DefaultRouter

from .views import NotificationOutboxViewSet

router = DefaultRouter()
router.register(r"outbox", NotificationOutboxViewSet, basename="notification-outbox")

urlpatterns = router.urls
