
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import ProjectSubmission, Project

approved = ProjectSubmission.objects.filter(status='Approved')
print(f'Found {approved.count()} Approved submissions.')

for ps in approved:
    has_project = hasattr(ps, 'project')
    print(f'Submission: {ps.title}')
    print(f'  Has Project: {has_project}')
    if has_project:
        print(f'  Project Status: {ps.project.status}')
