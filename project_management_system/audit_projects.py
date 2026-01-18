import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()
from authentication.models import Project

def audit():
    projects = Project.objects.filter(status='In Progress')
    print(f"Total In Progress Projects: {projects.count()}")
    for p in projects:
        group = p.submission.group
        teachers = [t.username for t in group.teachers.all()] if group else []
        print(f"ID: {p.id} | Title: {p.title} | Group: {group.name if group else 'None'} | Teachers: {teachers}")

if __name__ == "__main__":
    audit()
