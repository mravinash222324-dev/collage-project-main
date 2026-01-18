
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project

projects = Project.objects.all()
print(f"Total projects: {projects.count()}")
print(f"{'ID':3} | {'Project Status':15} | {'Sub Status':15} | {'is_alumni':9} | {'Title'}")
print("-" * 80)
for p in projects:
    sub_status = p.submission.status if p.submission else "N/A"
    print(f"{p.id:3} | {p.status:15} | {sub_status:15} | {p.is_alumni!s:9} | {p.title}")
