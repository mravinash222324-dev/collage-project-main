import os
import django
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import User, ProjectSubmission, Project

def debug():
    u = User.objects.first()
    try:
        print("Attempting to create ProjectSubmission...")
        sub = ProjectSubmission.objects.create(
            student=u,
            title="Debug Title",
            abstract_text="Debug Abstract",
            status='Completed',
            innovation_score=9.0,
            relevance_score=9.0
        )
        print("ProjectSubmission created. Attempting to create Project...")
        proj = Project.objects.create(
            submission=sub,
            title="Debug Title",
            abstract="Debug Abstract",
            status='Completed',
            is_alumni=True
        )
        print("Project created successfully.")
    except Exception as e:
        print(f"Error Type: {type(e)}")
        print(f"Error Message: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    debug()
