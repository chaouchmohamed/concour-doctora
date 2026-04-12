from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CandidateFileImportView, CandidateImportBatchViewSet, CandidateImportEntryPointView

router = DefaultRouter()
router.register(r"batches", CandidateImportBatchViewSet, basename="import-batch")

urlpatterns = [
    path("candidates/", CandidateImportEntryPointView.as_view(), name="import-candidates"),
    path("candidates/file/", CandidateFileImportView.as_view(), name="import-candidates-file"),
    *router.urls,
]
