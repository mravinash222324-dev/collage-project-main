with open('authentication/serializers.py', 'a', encoding='utf-8') as f:
    f.write('''

class CheckpointSerializer(serializers.ModelSerializer):
    """
    Serializer for Checkpoint model - AI-generated project milestones
    """
    class Meta:
        model = Checkpoint
        fields = ('id', 'project', 'title', 'description', 'deadline', 'is_completed', 'date_completed')
        read_only_fields = ('id',)
''')
print('CheckpointSerializer added successfully')
