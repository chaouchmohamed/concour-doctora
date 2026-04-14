from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AnonymousCodeViewSet, ExamCopyViewSet, UploadCopyAndCodeView

router = DefaultRouter()
router.register(r"codes", AnonymousCodeViewSet, basename="anonymous-code")
router.register(r"copies", ExamCopyViewSet, basename="exam-copy")

urlpatterns = [
    path("upload/", UploadCopyAndCodeView.as_view(), name="upload-copy-and-code"),
] + router.urls
