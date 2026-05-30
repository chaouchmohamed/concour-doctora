from rest_framework import serializers

from apps.accounts.models import User

from .models import CorrectionAssignment, CopyGrade, GradeDiscrepancy, SubjectGradeLock


class CorrectionAssignmentCreateSerializer(serializers.Serializer):
    subject_id = serializers.IntegerField()
    corrector_ids = serializers.ListField(
        child=serializers.IntegerField(), min_length=2
    )


class CorrectionAssignmentReadSerializer(serializers.ModelSerializer):
    corrector_email = serializers.CharField(source="corrector.email", read_only=True)
    corrector_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CorrectionAssignment
        fields = [
            "id",
            "anonymous_code",
            "exam_subject_id",
            "corrector",
            "corrector_email",
            "corrector_name",
            "order",
            "created_at",
        ]
        read_only_fields = fields

    def get_corrector_name(self, obj) -> str:
        return (
            f"{obj.corrector.last_name} {obj.corrector.first_name}".strip()
            or obj.corrector.email
        )


class CorrectorCopySerializer(serializers.Serializer):
    copy_id = serializers.IntegerField()
    anonymous_code = serializers.CharField()
    file_url = serializers.CharField(allow_null=True)
    exam_subject_id = serializers.IntegerField(allow_null=True)


class AssignResultSerializer(serializers.Serializer):
    subject_id = serializers.IntegerField()
    correctors = serializers.ListField(child=serializers.CharField())
    copies_assigned = serializers.IntegerField()
    total_assignments = serializers.IntegerField()


class CopyGradeCreateSerializer(serializers.Serializer):
    anonymous_code = serializers.CharField(max_length=20)
    exam_subject_id = serializers.IntegerField()
    grade = serializers.DecimalField(max_digits=5, decimal_places=2)


class CopyGradeReadSerializer(serializers.ModelSerializer):
    corrector_email = serializers.CharField(source="corrector.email", read_only=True)

    class Meta:
        model = CopyGrade
        fields = [
            "id",
            "anonymous_code",
            "exam_subject_id",
            "corrector",
            "corrector_email",
            "grade",
            "correction_order",
            "submitted_at",
            "is_final",
        ]
        read_only_fields = fields


class CopyGradeSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        exam_subject_id = attrs.get("exam_subject_id") or getattr(
            self.instance, "exam_subject_id", None
        )
        if (
            exam_subject_id
            and SubjectGradeLock.objects.filter(
                exam_subject_id=exam_subject_id
            ).exists()
        ):
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


class AssignThirdCorrectorSerializer(serializers.Serializer):
    third_corrector_id = serializers.IntegerField()


class ComputeFinalGradesSerializer(serializers.Serializer):
    subject_id = serializers.IntegerField()


class FinalGradeResultSerializer(serializers.Serializer):
    anonymous_code = serializers.CharField()
    final_grade = serializers.CharField()
    rule_used = serializers.CharField()


class ComputeFinalGradesResultSerializer(serializers.Serializer):
    subject_id = serializers.IntegerField()
    final_grade_rule = serializers.CharField()
    results = FinalGradeResultSerializer(many=True)


class LockSubjectGradesSerializer(serializers.Serializer):
    subject_id = serializers.IntegerField()


class GenerateCorrectionPVSerializer(serializers.Serializer):
    subject_id = serializers.IntegerField()


class ResolveDiscrepancySerializer(serializers.Serializer):
    final_grade = serializers.DecimalField(max_digits=5, decimal_places=2)
    coordinator_note = serializers.CharField(required=False, allow_blank=True)
