from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("", RedirectView.as_view(url="/api/docs/", permanent=False), name="root-redirect"),
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/", include("apps.common.urls")),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/candidates/", include("apps.candidates.urls")),
    path("api/examinations/", include("apps.examinations.urls")),
    path("api/attendance/", include("apps.attendance.urls")),
    path("api/anonymization/", include("apps.anonymization.urls")),
    path("api/correction/", include("apps.correction.urls")),
    path("api/deliberation/", include("apps.deliberation.urls")),
    path("api/pv/", include("apps.pv.urls")),
    path("api/audit/", include("apps.audit.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/import/", include("apps.integrations.urls")),
]
