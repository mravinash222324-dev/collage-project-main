import os
import django
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import User, ProjectSubmission, Project

def run():
    with open('user_projects_info.txt', 'w', encoding='utf-8') as f:
        f.write("Starting check...\n")
        # Find user 'avinash'
        users = User.objects.filter(username__icontains='avinash')
        if not users.exists():
            f.write("No user found with 'avinash'\n")
            return

        for user in users:
            f.write(f"User: {user.username} (ID: {user.id})\n")
            student_groups = user.student_groups.all()
            f.write(f"Groups: {[g.name for g in student_groups]}\n")

            submissions = ProjectSubmission.objects.filter(
                Q(group__in=student_groups) | 
                Q(student=user) | 
                Q(project__team__members=user)
            ).distinct().order_by('-submitted_at')

            f.write(f"Total Submissions: {submissions.count()}\n")

            for sub in submissions:
                status = sub.status
                title = sub.title
                f.write(f"- Project: '{title}' (Status: {status}, ID: {sub.id})\n")
                
                try:
                    proj = sub.project
                    f.write(f"  - Project Model ID: {proj.id}, Status: {proj.status}\n")
                    f.write(f"  - Team: {[m.username for m in proj.team.members.all()]}\n")
                except ObjectDoesNotExist:
                     f.write(f"  - No associated Project model found.\n")

if __name__ == "__main__":
    run()
