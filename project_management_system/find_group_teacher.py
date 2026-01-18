
import os
import sys
import django

sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project_management.settings")
django.setup()

from authentication.models import Group, User

group_id = 1

with open("teacher_view_output.txt", "w") as f:
    try:
        group = Group.objects.get(id=group_id)
        f.write(f"Group: {group.name}\n")
        
        teachers = User.objects.filter(teaching_groups=group)
        f.write(f"Teachers for this group: {[t.username for t in teachers]}\n")
        
        if teachers.exists():
            teacher = teachers.first()
            # Run check for this teacher
            from authentication.models import ProjectSubmission
            queryset = ProjectSubmission.objects.filter(group__in=teacher.teaching_groups.all()).order_by('-submitted_at')
            submissions = queryset.filter(status='Submitted')
            f.write(f"Visible Submissions for {teacher.username}:\n")
            for s in submissions:
                 f.write(f" - ID: {s.id}, Title: {s.title}\n")
        else:
            f.write("No teachers assigned to this group yet.\n")
            
    except Group.DoesNotExist:
        f.write("Group not found\n")

