import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()
from authentication.models import User, ProjectSubmission, Project

def debug_filter():
    u = User.objects.get(username='ICAXSCS019')
    tg = u.teaching_groups.all()
    print(f"Teacher groups: {[g.name for g in tg]}")
    
    gwp = list(Project.objects.filter(status__in=['In Progress', 'Completed']).values_list('submission__group_id', flat=True))
    print(f"Groups with existing projects: {gwp}")
    
    qs_full = ProjectSubmission.objects.filter(group__in=tg, status='Submitted')
    print(f"Full pending submissions count for teacher: {qs_full.count()}")
    for s in qs_full:
        print(f"  Submission ID: {s.id}, Title: {s.title}, Group ID: {s.group_id}")
    
    qs_filtered = qs_full.exclude(group_id__in=gwp)
    print(f"Filtered (Pending) count: {qs_filtered.count()}")

if __name__ == "__main__":
    debug_filter()
