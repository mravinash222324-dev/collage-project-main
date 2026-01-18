import os
import django
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import User, ProjectSubmission, Project, Group
from rest_framework.test import APIClient

def test_teacher_flow():
    print("\n--- Testing Teacher Approval Flow ---")
    
    # 1. Setup Student & Project
    student_user, _ = User.objects.get_or_create(username="test_student_flow", defaults={'role': 'student', 'email': 'studentflow@test.com'})
    project_sub = ProjectSubmission.objects.create(
        student=student_user,
        title="Teacher Flow Test Project",
        abstract_text="Testing if teacher approval works.",
        ai_similarity_report={"originality_status": "OK", "plagiarism_score": 0},
        status="Submitted" 
    )
    print(f"Created Submission: {project_sub.title} (Status: {project_sub.status})")

    # 1.5 Setup Group (Required for Teacher Permission)
    group, _ = Group.objects.get_or_create(name="Test Flow Group")
    group.students.add(student_user)
    
    # Associate submission with group
    project_sub.group = group
    project_sub.save()

    # 2. Setup Teacher
    teacher_user, created = User.objects.get_or_create(username="test_teacher_flow", defaults={'role': 'Teacher', 'email': 'teacherflow@test.com'})
    if not created and teacher_user.role != 'Teacher':
        teacher_user.role = 'Teacher'
        teacher_user.save()
        
    group.teachers.add(teacher_user) # Give permission
    
    client = APIClient()
    client.force_authenticate(user=teacher_user)
    
    # DEBUG PERMISSIONS
    print(f"Teacher ID: {teacher_user.id}")
    print(f"Teacher Groups: {list(teacher_user.teaching_groups.all())}")
    print(f"Subm Group: {project_sub.group}")

    # 3. Simulate Approval Request
    print("Attempting Approval via API...")
    url = f"/teacher/submissions/{project_sub.id}/"
    data = {
        "status": "Approved", # or "In Progress"? usually Approved -> Project created
        "teacher_feedback": "Looks good, approved for development."
    }
    
    # Note: Using patch or put depending on implementation. Usually patch for status update.
    response = client.patch(url, data, format='json')
    
    if response.status_code in [200, 201, 204]:
        print("✅ API Approval Success")
    else:
        print(f"❌ API Failed: {response.status_code} - {response.data}")
        return

    # 4. Verify Database State
    project_sub.refresh_from_db()
    print(f"Submission Status after: {project_sub.status}")
    
    if project_sub.status == "Approved":
        print("✅ Submission marked Approved")
    else:
        print("⚠️ Submission status mismatch")

    # Check if actual Project/Group was created (if logic exists)
    # This depends on your specific business logic.
    # Usually approving a submission creates a Project instance.
    chk_project = Project.objects.filter(title="Teacher Flow Test Project").first()
    if chk_project:
        print(f"✅ Project Instance Created: {chk_project.title}")
    else:
        print("ℹ️ No Project instance created (check if this is expected behavior)")

    # Cleanup
    project_sub.delete()
    if chk_project: chk_project.delete()
    print("Test Complete.")

if __name__ == "__main__":
    test_teacher_flow()
