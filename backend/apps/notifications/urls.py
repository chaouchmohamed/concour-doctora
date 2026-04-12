from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import DispatchConvocationsView, NotificationOutboxViewSet

router = DefaultRouter()
router.register(r"outbox", NotificationOutboxViewSet, basename="notification-outbox")

urlpatterns = [
    path("dispatch-convocations/", DispatchConvocationsView.as_view(), name="dispatch-convocations"),
    *router.urls,
]
