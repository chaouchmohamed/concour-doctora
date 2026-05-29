from decimal import Decimal

from rest_framework import serializers

from .models import ExamAllocation, ExamRoom, ExamSession, ExamSubject, SubjectSchedule


class ExamSessionSerializer(serializers.ModelSerializer):
    lottery_subject_name = serializers.CharField(
        source="lottery_subject.name", read_only=True, default=None
    )

    class Meta:
        model = ExamSession
        fields = "__all__"


class ExamSubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamSubject
        fields = "__all__"

    def validate_coefficient(self, value):
        if value <= 0:
            raise serializers.ValidationError("Coefficient must be greater than 0.")
        return value

    def validate_pass_threshold(self, value):
        max_score = self.initial_data.get("max_score")
        if max_score is not None:
            try:
                max_score_dec = Decimal(str(max_score))
            except Exception:
                return value
            if value > max_score_dec:
                raise serializers.ValidationError(
                    "Pass threshold cannot exceed max score."
                )
        return value

    def validate_discrepancy_threshold(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Discrepancy threshold cannot be negative."
            )
        return value


class ExamRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamRoom
        fields = "__all__"

    def validate_capacity(self, value):
        if value < 0:
            raise serializers.ValidationError("Capacity cannot be negative.")
        return value


class SubjectScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubjectSchedule
        fields = "__all__"

    def validate_duration_minutes(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Duration must be greater than 0 minutes."
            )
        return value


class ExamAllocationSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source="candidate.last_name", read_only=True)
    candidate_application_number = serializers.CharField(
        source="candidate.application_number", read_only=True
    )

    class Meta:
        model = ExamAllocation
        fields = "__all__"


class CallListEntrySerializer(serializers.Serializer):
    seat_number = serializers.IntegerField()
    application_number = serializers.CharField()
    full_name = serializers.CharField()
    room = serializers.CharField()
    attendance_status = serializers.CharField(allow_null=True, required=False)


class CallListBlockSerializer(serializers.Serializer):
    exam_date = serializers.CharField()
    start_time = serializers.CharField()
    room = serializers.CharField()
    duration_minutes = serializers.IntegerField()
    candidates = CallListEntrySerializer(many=True)


class AutoAllocateResultSerializer(serializers.Serializer):
    schedule_id = serializers.IntegerField()
    candidates_allocated = serializers.IntegerField()
    rooms_used = serializers.IntegerField()
    per_room = serializers.IntegerField()


class LotteryResultSerializer(serializers.Serializer):
    selected_subject_id = serializers.IntegerField()


class PVResultSerializer(serializers.Serializer):
    pv_document_id = serializers.IntegerField()
    pv_document_identifier = serializers.CharField()
    pv_type = serializers.CharField()
