from rest_framework import serializers

from .models import AnonymousCode, ExamCopy


class AnonymousCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnonymousCode
        fields = "__all__"


class ExamCopySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamCopy
        fields = "__all__"
