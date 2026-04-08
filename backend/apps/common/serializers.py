from rest_framework import serializers


class PlaceholderSerializer(serializers.Serializer):
    """TODO: replace with concrete serializers."""

    placeholder = serializers.CharField(read_only=True, default="TODO")
