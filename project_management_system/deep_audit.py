
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Group, Project, User

print("--- DEEP GROUP AUDIT ---")
for g in Group.objects.all():
    teachers = g.teachers.all()
    teacher_list = [(t.username, t.role, t.id) for t in teachers]
    ongoing_projects = Project.objects.filter(submission__group=g, status='In Progress')
    
    print(f"Group: {g.name} (ID: {g.id})")
    print(f"  Teachers: {teacher_list}")
    print(f"  Ongoing Projects: {[p.title for p in ongoing_projects]}")
    
    # Check if 'teachers__isnull=True' would be true for this group
    has_teachers = g.teachers.exists()
    print(f"  Has Teachers (exists()): {has_teachers}")
    
    # Simulate the query filter
    is_unassigned = Project.objects.filter(id__in=ongoing_projects, submission__group__teachers__isnull=True).exists()
    print(f"  Is Unassigned (according to filter): {is_unassigned}")
    print("-" * 20)

print("\n--- ALL TEACHERS ---")
for t in User.objects.filter(role__in=['Teacher', 'HOD/Admin']):
    print(f"Teacher: {t.username} (ID: {t.id}, Role: {t.role})")
    print(f"  Teaching Groups: {[g.name for g in t.teaching_groups.all()]}")
