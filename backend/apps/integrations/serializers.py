from rest_framework import serializers

from .models import CandidateImportBatch


class CandidateImportBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidateImportBatch
        fields = "__all__"


MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


class CandidateFileImportSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        name_lower = (value.name or "").lower()
        if not name_lower.endswith((".csv", ".xlsx")):
            raise serializers.ValidationError(
                "Unsupported file format. Only .csv and .xlsx files are accepted."
            )
        if value.size > MAX_FILE_SIZE_BYTES:
            raise serializers.ValidationError(
                f"File size exceeds the {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB limit."
            )
        return value
