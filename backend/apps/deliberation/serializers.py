from rest_framework import serializers

from .models import DeliberationResult, DeliberationRun


class DeliberationRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliberationRun
        fields = [
            "id",
            "exam_session_id",
            "status",
            "admission_threshold",
            "waiting_list_capacity",
            "is_archived",
            "closed_at",
            "closed_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "is_archived",
            "closed_at",
            "closed_by",
            "created_at",
            "updated_at",
        ]


class DeliberationResultSerializer(serializers.ModelSerializer):
    candidate_info = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DeliberationResult
        fields = [
            "id",
            "deliberation",
            "candidate_id",
            "candidate_info",
            "anonymous_code",
            "weighted_average",
            "rank",
            "outcome",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "candidate_id",
            "candidate_info",
            "weighted_average",
            "rank",
            "outcome",
            "created_at",
        ]

    def get_candidate_info(self, obj) -> str:
        if not obj.candidate_id:
            return ""
        from apps.candidates.models import Candidate

        try:
            c = Candidate.objects.get(pk=obj.candidate_id)
            return f"{c.application_number} - {c.last_name} {c.first_name}"
        except Candidate.DoesNotExist:
            return f"candidate_id={obj.candidate_id}"


class ComputeDeliberationSerializer(serializers.Serializer):
    session_id = serializers.IntegerField()


class CloseDeliberationSerializer(serializers.Serializer):
    pass


class GenerateDeliberationPVSerializer(serializers.Serializer):
    deliberation_id = serializers.IntegerField()


class SignPVSerializer(serializers.Serializer):
    pv_document_id = serializers.IntegerField()


class ArchiveDeliberationSerializer(serializers.Serializer):
    deliberation_id = serializers.IntegerField()
