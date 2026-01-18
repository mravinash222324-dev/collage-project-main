
# Setup Django Environment
import sys
import os
import django

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project, User, VivaSession, VivaQuestion, ProjectSubmission, Group

def populate_data(project_id):
    try:
        project = Project.objects.get(id=project_id)
        student = project.submission.student
        
        print(f"Populating data for Project: {project.title} (Student: {student.username})")

        # 1. Create a Dummy Viva Session
        session = VivaSession.objects.create(project=project, student=student)
        VivaQuestion.objects.create(session=session, question_text="Explain MVC.", student_answer="Model View Controller...", ai_score=9, ai_feedback="Correct.")
        VivaQuestion.objects.create(session=session, question_text="What is Django?", student_answer="A web framework.", ai_score=8, ai_feedback="Brief but accurate.")
        print("✅ Added Dummy Viva Session")

        # 2. Add Dummy Audit Report
        project.audit_security_score = 92
        project.audit_quality_score = 88
        project.audit_report = {
            "summary": "Code is secure. No major vulnerabilities found. Good use of modularity.",
            "issues": []
        }
        project.save()
        print("✅ Added Dummy Audit Scores")

        # 3. Add to a Group (if not already)
        if not project.submission.group:
            group, created = Group.objects.get_or_create(name="AI-Test-Team")
            group.students.add(student)
            project.submission.group = group
            project.submission.save()
            print("✅ Assigned to Group 'AI-Test-Team'")
            
        print("\nDONE! Now run Test 8 again.")

    except Project.DoesNotExist:
        print(f"Project ID {project_id} not found.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python populate_verify.py <PROJECT_ID>")
    else:
        populate_data(sys.argv[1])
