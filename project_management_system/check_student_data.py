
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from django.test import RequestFactory
from authentication.models import User, ProjectSubmission
from authentication.serializers import StudentSubmissionSerializer
from authentication.views import StudentDashboardView

def test():
    student = User.objects.get(username='AVINASH2')
    factory = RequestFactory()
    request = factory.get('/student/submissions/')
    request.user = student
    
    view = StudentDashboardView()
    view.request = request
    queryset = view.get_queryset()
    
    print(f"Number of submissions for {student.username}: {queryset.count()}")
    
    serializer = StudentSubmissionSerializer(queryset, many=True)
    data = serializer.data
    
    for item in data:
        print(f"\nProject: {item['title']} (ID: {item['id']}, Project ID: {item['project_id']})")
        print(f"Status: {item['status']}")
        print(f"Team Members ({len(item['team_members'])}):")
        for m in item['team_members']:
            print(f" - {m['username']} ({m['role']})")

if __name__ == "__main__":
    test()
