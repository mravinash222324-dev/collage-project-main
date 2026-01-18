
import os
import sys
import django

sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project_management.settings")
django.setup()

from authentication.models import User, ProjectSubmission, Project, Group

username = "AVINASH1"

output_file = "debug_avinash_output.txt"
with open(output_file, "w") as f:
    try:
        user = User.objects.get(username=username)
        f.write(f"User: {user.username} (ID: {user.id})\n")
        
        groups = user.student_groups.all()
        f.write(f"Groups: {[g.name for g in groups]}\n")
        
        for group in groups:
            f.write(f"\n--- Checking Group: {group.name} (ID: {group.id}) ---\n")
            
            # Check existing projects
            projects = Project.objects.filter(submission__group=group)
            f.write(f"Projects for group '{group.name}':\n")
            for p in projects:
                f.write(f"  - ID: {p.id}, Title: {p.title}, Status: {p.status}\n")
                
            # Check submissions
            submissions = ProjectSubmission.objects.filter(group=group)
            f.write(f"Submissions for group '{group.name}':\n")
            for s in submissions:
                 f.write(f"  - ID: {s.id}, Title: {s.title}, Status: {s.status}\n")

            # Check existing logic condition
            groups_with_projects = Project.objects.filter(
                status__in=['In Progress', 'Completed'],
                submission__group=group
            ).values_list('submission__group_id', flat=True)
            
            f.write(f"Group IDs with active projects: {list(groups_with_projects)}\n")
            is_blocked = group.id in groups_with_projects
            f.write(f"Is Group {group.id} blocked? {is_blocked}\n")

    except User.DoesNotExist:
        f.write(f"User {username} not found\n")

