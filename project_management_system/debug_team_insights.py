import os
import django
from django.conf import settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project_management.settings")
django.setup()

from authentication.models import User, Project, ProjectSubmission, Team, ProgressUpdate, VivaSession, VivaQuestion, CodeReview
from authentication.serializers import ApprovedProjectSerializer
from django.utils import timezone

def run_debug():
    print("--- Starting Team Insights Debug ---")

    # 1. Setup Data
    # Create Users
    s1, _ = User.objects.get_or_create(username="student_A", email="a@example.com", role="Student")
    s2, _ = User.objects.get_or_create(username="student_B", email="b@example.com", role="Student")
    
    # Create Project
    sub, _ = ProjectSubmission.objects.get_or_create(student=s1, title="Debug Project", abstract_text="Abstract")
    proj, _ = Project.objects.get_or_create(submission=sub, title="Debug Project", abstract="Abstract", status="In Progress")
    
    # Create Team
    team, _ = Team.objects.get_or_create(project=proj)
    team.members.add(s1, s2)
    
    # Clear previous stats data for clean test
    ProgressUpdate.objects.filter(project=proj).delete()
    CodeReview.objects.filter(project=proj).delete()
    VivaSession.objects.filter(project=proj).delete()

    print(f"Project Created: {proj.title} with members {s1.username}, {s2.username}")

    # 2. Add Activity
    
    # Student A: 2 Updates, 1 Review, Viva Score 8
    ProgressUpdate.objects.create(project=proj, author=s1, update_text="Update 1", ai_suggested_percentage=10)
    ProgressUpdate.objects.create(project=proj, author=s1, update_text="Update 2", ai_suggested_percentage=20)
    
    CodeReview.objects.create(project=proj, student=s1, file_name="test.py", code_content="print('hello')")
    
    vs1 = VivaSession.objects.create(project=proj, student=s1)
    VivaQuestion.objects.create(session=vs1, question_text="Q1", ai_score=8)
    VivaQuestion.objects.create(session=vs1, question_text="Q2", ai_score=8)
    
    # Student B: 1 Update, 0 Review, Viva Score 5
    ProgressUpdate.objects.create(project=proj, author=s2, update_text="Update B1", ai_suggested_percentage=15)
    
    vs2 = VivaSession.objects.create(project=proj, student=s2)
    VivaQuestion.objects.create(session=vs2, question_text="Q1", ai_score=4)
    VivaQuestion.objects.create(session=vs2, question_text="Q2", ai_score=6)
    
    print("Activity Added.")

    # 3. Run Serializer
    serializer = ApprovedProjectSerializer(proj)
    stats = serializer.data.get('member_stats')
    
    print("\n--- Serializer Output ---")
    import json
    print(json.dumps(stats, indent=2))
    
    # 4. Assertions
    s1_stat = next(s for s in stats if s['username'] == 'student_A')
    s2_stat = next(s for s in stats if s['username'] == 'student_B')
    
    print("\n--- Verification ---")
    
    # Check Student A
    assert s1_stat['updates_count'] == 2, f"Expected 2 updates for A, got {s1_stat['updates_count']}"
    assert s1_stat['reviews_count'] == 1, f"Expected 1 review for A, got {s1_stat['reviews_count']}"
    assert s1_stat['viva_average'] == 8.0, f"Expected 8.0 avg for A, got {s1_stat['viva_average']}"
    print("Student A: PASS")
    
    # Check Student B
    assert s2_stat['updates_count'] == 1, f"Expected 1 updates for B, got {s2_stat['updates_count']}"
    assert s2_stat['reviews_count'] == 0, f"Expected 0 review for B, got {s2_stat['reviews_count']}"
    assert s2_stat['viva_average'] == 5.0, f"Expected 5.0 avg for B, got {s2_stat['viva_average']}"
    print("Student B: PASS")
    
    print("\nALL TESTS PASSED: Logic appears correct.")

if __name__ == "__main__":
    run_debug()
