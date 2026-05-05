from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Candidate
from .permissions import CandidateAccessPermission
from .serializers import CandidateSerializer


class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all().order_by("id")
    serializer_class = CandidateSerializer
    permission_classes = [IsAuthenticated, CandidateAccessPermission]
