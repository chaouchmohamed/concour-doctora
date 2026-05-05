from rest_framework import serializers

from .models import PVDocument, PVSignature


class PVSignatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = PVSignature
        fields = "__all__"


class PVDocumentSerializer(serializers.ModelSerializer):
    signatures = PVSignatureSerializer(many=True, read_only=True)

    class Meta:
        model = PVDocument
        fields = "__all__"
