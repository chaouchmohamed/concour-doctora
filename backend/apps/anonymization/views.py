from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import AnonymousCode, ExamCopy
from .permissions import AnonymousCodeAccessPermission, ExamCopyAccessPermission
from .serializers import AnonymousCodeSerializer, ExamCopySerializer


class AnonymousCodeViewSet(viewsets.ModelViewSet):
    queryset = AnonymousCode.objects.all().order_by("id")
    serializer_class = AnonymousCodeSerializer
    permission_classes = [IsAuthenticated, AnonymousCodeAccessPermission]


class ExamCopyViewSet(viewsets.ModelViewSet):
    queryset = ExamCopy.objects.select_related("anonymous_code").all().order_by("id")
    serializer_class = ExamCopySerializer
    permission_classes = [IsAuthenticated, ExamCopyAccessPermission]
