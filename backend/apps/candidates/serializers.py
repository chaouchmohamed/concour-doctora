from rest_framework import serializers

from .models import Candidate


class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = [
            "id",
            "national_id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "application_number",
            "status",
            "imported_at",
            "is_active",
        ]
        read_only_fields = ["id", "imported_at"]
