
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project

print("--- PROJECTS ---")
for p in Project.objects.all():
    print(f"ID: {p.id} | {p.title[:40]}... | {p.status}")
