
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project

print("Fixing project status...")
projects = Project.objects.filter(title__icontains="Project Management")

for p in projects:
    if p.status != 'Completed':
        print(f"Updating '{p.title}' from {p.status} to Completed")
        p.status = 'Completed'
        # Also update submission status
        if p.submission:
             p.submission.status = 'Completed'
             p.submission.save()
        p.save()
    else:
        print(f"'{p.title}' is already Completed.")
