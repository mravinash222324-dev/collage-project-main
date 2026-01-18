import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()
from authentication.models import User, ProjectSubmission
from authentication.serializers import StudentSubmissionSerializer
import json

def check():
    try:
        u = User.objects.get(username='AVINASH2')
        subs = ProjectSubmission.objects.filter(group__students=u)
        print(f"Found {subs.count()} submissions for AVINASH2")
        for s in subs:
            data = StudentSubmissionSerializer(s).data
            print(f"Submission: {s.title}")
            print(f"Team Members: {json.dumps(data['team_members'], indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
