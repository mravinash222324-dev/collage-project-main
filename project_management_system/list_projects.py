
import os
import django
import sys

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management_system.settings')
django.setup()

from authentication.models import Project, User

def list_projects():
    projects = Project.objects.all().order_by('-id')
    print(f"{'ID':<5} | {'Title':<40} | {'Student (User)':<20} | {'Status'}")
    print("-" * 80)
    
    for p in projects:
        student_name = p.submission.student.username if p.submission and p.submission.student else "Unknown"
        print(f"{p.id:<5} | {p.title[:38]:<40} | {student_name:<20} | {p.status}")

if __name__ == "__main__":
    list_projects()
