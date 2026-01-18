
with open('authentication/serializers.py', 'a', encoding='utf-8') as f:
    f.write('''

class TimedAssignmentSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(read_only=True)
    time_remaining = serializers.SerializerMethodField()

    class Meta:
        model = TimedAssignment
        fields = '__all__'
        read_only_fields = ('created_by', 'start_time', 'end_time')

    def get_time_remaining(self, obj):
        if not obj.is_active:
            return 0
        remaining = obj.end_time - timezone.now()
        return max(0, int(remaining.total_seconds()))

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    submitted_by_username = serializers.CharField(source='submitted_by.username', read_only=True)
    
    class Meta:
        model = AssignmentSubmission
        fields = '__all__'
        read_only_fields = ('submitted_by', 'submitted_at', 'ai_verified', 'ai_feedback', 'ai_score')
''')
print("Appended serializers")
