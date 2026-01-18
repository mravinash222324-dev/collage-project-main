import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import User, Project, Team, ProjectSubmission, Group
from rest_framework.test import APIClient
from django.utils import timezone

def run_test():
    print("=== Setup Data ===")
    
    # Create or Get Users
    leader, _ = User.objects.get_or_create(username='leader', email='leader@test.com', defaults={'role': 'Student'})
    member, _ = User.objects.get_or_create(username='member', email='member@test.com', defaults={'role': 'Student'})
    teacher, _ = User.objects.get_or_create(username='teacher', email='teacher@test.com', defaults={'role': 'Teacher'})
    
    print(f"Users: {leader}, {member}, {teacher}")

    # Create Group
    group, _ = Group.objects.get_or_create(name='Test Group')
    
    # Create Project Submission and Project
    submission, _ = ProjectSubmission.objects.get_or_create(
        title='Test Team Project',
        student=leader,
        defaults={
            'abstract_text': 'Test Abstract',
            'group': group,
            'status': 'Approved'
        }
    )
    
    project, created = Project.objects.get_or_create(
        submission=submission,
        defaults={'title': submission.title, 'abstract': submission.abstract_text, 'status': 'In Progress'}
    )
    
    # Ensure Team exists
    team, _ = Team.objects.get_or_create(project=project)
    team.members.add(leader)
    # Ensure member is NOT in team initially
    if member in team.members.all():
        team.members.remove(member)
        
    print(f"Project: {project.id} - {project.title}")
    print(f"Initial Team: {[u.username for u in team.members.all()]}")
    
    # === TEST 1: Add Member (As Leader) ===
    print("\n=== TEST 1: Add Member (As Leader) ===")
    client = APIClient()
    client.force_authenticate(user=leader)
    
    url = f'/projects/{project.id}/members/'
    response = client.post(url, {'username': member.username}, format='json')
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.data}")
    
    if response.status_code == 200:
        print("SUCCESS: Member added.")
    else:
        print("FAILURE: Could not add member.")

    team.refresh_from_db()
    print(f"Team Members: {[u.username for u in team.members.all()]}")
    
    # === TEST 2: Add Duplicate Member ===
    print("\n=== TEST 2: Add Duplicate Member ===")
    response = client.post(url, {'username': member.username}, format='json')
    print(f"Status: {response.status_code} (Expected 400)")
    
    # === TEST 3: Remove Member (As Leader) ===
    print("\n=== TEST 3: Remove Member (As Leader) ===")
    response = client.delete(url, {'user_id': member.id}, format='json')
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.data}")

    team.refresh_from_db()
    print(f"Team Members: {[u.username for u in team.members.all()]}")

    if member not in team.members.all():
         print("SUCCESS: Member removed.")
    else:
         print("FAILURE: Member not removed.")

if __name__ == '__main__':
    try:
        run_test()
    except Exception as e:
        print(f"ERROR: {e}")
