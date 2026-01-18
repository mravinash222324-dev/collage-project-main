
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import ProjectSubmission
from authentication.serializers import StudentSubmissionSerializer

def test():
    # Find the project from earlier
    ps = ProjectSubmission.objects.filter(title__icontains='ai project manager').first()
    if not ps:
        print("Project not found")
        return
        
    serializer = StudentSubmissionSerializer(ps)
    data = serializer.data
    
    print(f"Submission: {data['title']}")
    print(f"Team Members: {json.dumps(data['team_members'], indent=2)}")

if __name__ == "__main__":
    test()
