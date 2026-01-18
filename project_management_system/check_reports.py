
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project

projects = Project.objects.filter(status='Completed')
print(f"Completed Projects: {projects.count()}")

for p in projects:
    has_report = bool(p.final_report)
    print(f"ID: {p.id} | Title: {p.title[:20]}... | Has Report: {has_report}")
    if has_report:
        print(f"   -> Report URL: {p.final_report.url}")
