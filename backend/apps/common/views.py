from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers as rf_serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Health check",
        responses={
            200: inline_serializer(
                "HealthResponse", fields={"status": rf_serializers.CharField()}
            )
        },
    )
    def get(self, request):
        return Response({"status": "ok"})
