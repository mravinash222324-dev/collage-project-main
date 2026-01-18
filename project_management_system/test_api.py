import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import TimedAssignment, User
from django.test.client import Client, RequestFactory
from django.contrib.auth import get_user_model
from authentication.views import TimedAssignmentListView
from rest_framework.test import APIClient, force_authenticate

print("=== Checking Assignments ===")
for assignment in TimedAssignment.objects.all():
    print(f"ID: {assignment.id}")
    print(f"Title: {assignment.title}")
    print(f"Creator: {assignment.created_by.username} (Role: {assignment.created_by.role})")
    print(f"Groups: {list(assignment.assigned_groups.values_list('name', flat=True))}")
    print()

print("\n=== Testing API Endpoint as Teacher ===")
teachers = User.objects.filter(role='Teacher')
print(f"Found {teachers.count()} teachers")

if teachers.exists():
    teacher = teachers.first()
    print(f"Testing with teacher: {teacher.username}\n")
    
    client = APIClient()
    client.force_authenticate(user=teacher)
    
    response = client.get('/assignments/list/')
    print(f"Status Code: {response.status_code}")
    print(f"Response Data: {json.dumps(response.data, indent=2)}")
else:
    print("No teachers found!")

print("\n=== Testing as HOD/Admin ===")
admins = User.objects.filter(role='HOD/Admin')
if admins.exists():
    admin = admins.first()
    print(f"Testing with admin: {admin.username}\n")
    
    client2 = APIClient()
    client2.force_authenticate(user=admin)
    
    response2 = client2.get('/assignments/list/')
    print(f"Status Code: {response2.status_code}")
    print(f"Response Data: {json.dumps(response2.data, indent=2)}")
