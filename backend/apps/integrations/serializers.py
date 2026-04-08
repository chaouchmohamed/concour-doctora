from rest_framework import serializers

from .models import CandidateImportBatch


class CandidateImportBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidateImportBatch
        fields = "__all__"
