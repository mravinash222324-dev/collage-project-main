
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project, Team

projects = Project.objects.filter(status='Completed')
print(f"Completed Projects: {projects.count()}")

for p in projects:
    print(f"\nProject ID: {p.id} | Title: {p.title} | Status: {p.status}")
    print(f"Lead Student: {p.submission.student.username}")
    
    if hasattr(p, 'team'):
        print(f"Team Members: {[m.username for m in p.team.members.all()]}")
    else:
        print("No Team assigned.")
