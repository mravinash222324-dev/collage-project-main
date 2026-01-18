from rest_framework import serializers
from .models import StudentXP, XPLog, Badge
from authentication.serializers import UserSerializer

class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['id', 'name', 'description', 'icon', 'xp_required']

class XPLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = XPLog
        fields = ['id', 'amount', 'source', 'description', 'created_at']

class StudentXPSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    student_full_name = serializers.SerializerMethodField()
    badges = BadgeSerializer(source='student.badges', many=True, read_only=True)
    recent_logs = serializers.SerializerMethodField()
    rank = serializers.SerializerMethodField()

    class Meta:
        model = StudentXP
        fields = [
            'student_name', 'student_full_name', 'total_xp', 'level', 
            'viva_xp', 'assignment_xp', 'boss_battle_xp', 
            'badges', 'recent_logs', 'rank',
            'avatar_style', 'avatar_seed'
        ]

    def get_student_full_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.username

    def get_recent_logs(self, obj):
        logs = obj.student.xp_logs.order_by('-created_at')[:5]
        return XPLogSerializer(logs, many=True).data

    def get_rank(self, obj):
        # Calculate rank dynamically
        # Count how many students have more XP than this student
        higher_xp_count = StudentXP.objects.filter(total_xp__gt=obj.total_xp).count()
        return higher_xp_count + 1

class LeaderboardSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    student_full_name = serializers.SerializerMethodField()
    badges_count = serializers.SerializerMethodField()

    class Meta:
        model = StudentXP
        fields = ['student_name', 'student_full_name', 'total_xp', 'level', 'badges_count']

    def get_student_full_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.username

    def get_badges_count(self, obj):
        return obj.student.badges.count()
