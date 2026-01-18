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
        output = []
        for s in subs:
            data = StudentSubmissionSerializer(s).data
            output.append({
                "submission_title": s.title,
                "team_members": data['team_members']
            })
        with open('serializer_debug.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2)
        print("Written to serializer_debug.json")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
