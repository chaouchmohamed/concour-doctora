from rest_framework import serializers

from .models import AttendanceRecord, AttendanceSubmission


class AttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = "__all__"


class AttendanceSubmissionSerializer(serializers.ModelSerializer):
    records = AttendanceRecordSerializer(many=True, read_only=True)

    class Meta:
        model = AttendanceSubmission
        fields = "__all__"


class AttendanceCounterSerializer(serializers.Serializer):
    submission_id = serializers.IntegerField()
    schedule_id = serializers.IntegerField()
    total_expected = serializers.IntegerField()
    total_marked = serializers.IntegerField()
    total_unmarked = serializers.IntegerField()
    present_count = serializers.IntegerField()
    absent_count = serializers.IntegerField()
    is_finalized = serializers.BooleanField()


class AttendanceCSVImportSerializer(serializers.Serializer):
    file = serializers.FileField()


class AttendanceCSVImportResultSerializer(serializers.Serializer):
    created = serializers.IntegerField()
    skipped_duplicates = serializers.IntegerField()
    errors = serializers.ListField(child=serializers.DictField())


class AttendanceFinalizeResponseSerializer(serializers.Serializer):
    submission = AttendanceSubmissionSerializer()
    pv_document_id = serializers.IntegerField()
    pv_document_identifier = serializers.CharField()
