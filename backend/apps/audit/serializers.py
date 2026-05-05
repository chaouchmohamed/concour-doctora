from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = "__all__"
        read_only_fields = (
            "id",
            "timestamp",
            "user",
            "role",
            "ip_address",
            "action_type",
            "affected_object_type",
            "affected_object_id",
            "details",
        )
