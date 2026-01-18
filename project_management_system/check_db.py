
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project

projects = Project.objects.all()
print(f"Total projects: {projects.count()}")
for p in projects:
    print(f"ID: {p.id:3} | Status: {p.status:15} | Title: {p.title}")
