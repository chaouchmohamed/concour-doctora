from rest_framework import serializers

from .models import ExamRoom, ExamSession, ExamSubject, SubjectSchedule


class ExamSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamSession
        fields = "__all__"


class ExamSubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamSubject
        fields = "__all__"


class ExamRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamRoom
        fields = "__all__"


class SubjectScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubjectSchedule
        fields = "__all__"
