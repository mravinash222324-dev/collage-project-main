import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import User, ProjectSubmission, Project, Team

def debug_create():
    u = User.objects.first()
    print(f"Using user: {u.username}")
    try:
        sub = ProjectSubmission.objects.create(
            student=u,
            title="Debug Project",
            abstract_text="Debug Abstract",
            status='Completed'
        )
        print("Created submission")
        proj = Project.objects.create(
            submission=sub,
            title="Debug Project",
            abstract="Debug Abstract",
            status='Completed'
        )
        print("Created project")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_create()
