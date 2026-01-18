
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project

print("Searching strict...")
# Search for exact string
p = Project.objects.filter(title__icontains="Project Management System")
if p.exists():
    print(f"FOUND EXACT: {p.first().title} (ID: {p.first().id}, Status: {p.first().status})")
else:
    print("Exact match not found.")

print("Searching loose...")
all_p = Project.objects.all()
for p in all_p:
    if "management" in p.title.lower() or "system" in p.title.lower():
        print(f"POSSIBLE: {p.title} (ID: {p.id}, Status: {p.status})")
