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
