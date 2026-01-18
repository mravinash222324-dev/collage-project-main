# Quick fix script for serializers.py - adds CheckpointSerializer
import re

# Read the file
with open('authentication/serializers.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the CodeReviewSerializer and add CheckpointSerializer after it
checkpoint_serializer = '''
class CheckpointSerializer(serializers.ModelSerializer):
    """
    Serializer for Checkpoint model - AI-generated project milestones
    """
    class Meta:
        model = Checkpoint
        fields = ('id', 'project', 'title', 'description', 'deadline', 'is_completed', 'date_completed')
        read_only_fields = ('id',)
'''

# Find position after CodeReviewSerializer
pattern = r'(class CodeReviewSerializer.*?read_only_fields = \(.*?\)\s*\))'
match = re.search(pattern, content, re.DOTALL)

if match:
    insert_pos = match.end()
    new_content = content[:insert_pos] + '\n' + checkpoint_serializer + content[insert_pos:]
    
    with open('authentication/serializers_fixed.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fixed version written to serializers_fixed.py")
else:
    print("Could not find CodeReviewSerializer")
