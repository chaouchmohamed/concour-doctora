from rest_framework import serializers

from .models import AnonymousCode, ExamCopy


class UploadCopyAndCodeSerializer(serializers.Serializer):
    application_number = serializers.CharField(max_length=50)
    session_id = serializers.IntegerField()
    file = serializers.FileField()


class ExamCopySerializer(serializers.ModelSerializer):
    anonymous_code = serializers.CharField(source="anonymous_code.code", read_only=True)

    class Meta:
        model = ExamCopy
        fields = ["id", "anonymous_code", "file", "created_at"]
        read_only_fields = ["id", "anonymous_code", "created_at"]


class ExamCopyAdminSerializer(serializers.ModelSerializer):
    anonymous_code = serializers.CharField(source="anonymous_code.code", read_only=True)

    class Meta:
        model = ExamCopy
        fields = [
            "id",
            "anonymous_code",
            "file",
            "uploaded_by_user_id",
            "qr_detected_code",
            "created_at",
        ]
        read_only_fields = ["id", "anonymous_code", "created_at"]


class AnonymousCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnonymousCode
        fields = ["id", "code", "exam_session_id", "generated_at"]
        read_only_fields = fields


class AnonymousCodeAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnonymousCode
        fields = "__all__"
        read_only_fields = (
            "id",
            "code",
            "candidate_id_encrypted",
            "exam_session_id",
            "generated_at",
            "created_at",
            "updated_at",
        )


class CodingProgressSerializer(serializers.Serializer):
    session_id = serializers.IntegerField()
    total_present_candidates = serializers.IntegerField()
    codes_generated = serializers.IntegerField()
    copies_uploaded = serializers.IntegerField()
    is_complete = serializers.BooleanField()
