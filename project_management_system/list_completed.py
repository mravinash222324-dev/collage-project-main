
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project

print("Completed Projects with 'Management' in title:")
projects = Project.objects.filter(title__icontains="Management", status='Completed')
for p in projects:
    print(f"- {p.title}")
