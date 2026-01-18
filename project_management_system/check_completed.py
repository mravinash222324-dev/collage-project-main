
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project

projects = Project.objects.filter(status='Completed')
print(f"Completed projects: {projects.count()}")
for p in projects:
    student = p.submission.student
    print(f"ID: {p.id} | Title: {p.title} | Student: {student.username} | is_alumni: {p.is_alumni}")
