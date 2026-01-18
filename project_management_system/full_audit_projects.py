import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()
from authentication.models import Project

def full_audit():
    projects = Project.objects.all()
    print(f"Total Projects: {projects.count()}")
    print("-" * 80)
    print(f"{'ID':<4} | {'Title':<20} | {'Status':<12} | {'Group':<10} | {'Teachers'}")
    print("-" * 80)
    for p in projects:
        group = p.submission.group if p.submission else None
        gn = group.name if group else "None"
        teachers = [t.username for t in group.teachers.all()] if group else []
        print(f"{p.id:<4} | {p.title[:20]:<20} | {p.status:<12} | {gn:<10} | {teachers}")

if __name__ == "__main__":
    full_audit()
