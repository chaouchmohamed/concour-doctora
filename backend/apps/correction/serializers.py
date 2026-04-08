from rest_framework import serializers

from .models import CorrectionAssignment, CopyGrade, GradeDiscrepancy, SubjectGradeLock


class CorrectionAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CorrectionAssignment
        fields = "__all__"


class CopyGradeSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        exam_subject_id = attrs.get("exam_subject_id") or getattr(self.instance, "exam_subject_id", None)
        if exam_subject_id and SubjectGradeLock.objects.filter(exam_subject_id=exam_subject_id).exists():
            raise serializers.ValidationError(
                "Grades are locked for this subject and cannot be modified."
            )
        return attrs

    class Meta:
        model = CopyGrade
        fields = "__all__"


class GradeDiscrepancySerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeDiscrepancy
        fields = "__all__"


class SubjectGradeLockSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubjectGradeLock
        fields = "__all__"
