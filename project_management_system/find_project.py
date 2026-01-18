
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project

print("Searching for 'Management' in titles:")
projects = Project.objects.filter(title__icontains="Management")
for p in projects:
    print(f"FOUND: '{p.title}' (Status: {p.status})")
