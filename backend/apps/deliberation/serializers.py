from rest_framework import serializers

from .models import DeliberationResult, DeliberationRun


class DeliberationRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliberationRun
        fields = "__all__"


class DeliberationResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliberationResult
        fields = "__all__"
