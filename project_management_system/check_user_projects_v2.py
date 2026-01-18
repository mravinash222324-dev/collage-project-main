import os
import django
from django.db.models import Q
import sys

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import User, ProjectSubmission, Project

def run():
    print("Starting check...")
    # Find user 'avinash'
    users = User.objects.filter(username__icontains='avinash')
    if not users.exists():
        print("No user found with 'avinash'")
        return

    for user in users:
        print(f"User: {user.username} (ID: {user.id})")
        student_groups = user.student_groups.all()
        print(f"Groups: {[g.name for g in student_groups]}")

        submissions = ProjectSubmission.objects.filter(
            Q(group__in=student_groups) | 
            Q(student=user) | 
            Q(project__team__members=user)
        ).distinct().order_by('-submitted_at')

        print(f"Total Submissions: {submissions.count()}")

        for sub in submissions:
            status = sub.status
            title = sub.title
            print(f"- Project: '{title}' (Status: {status}, ID: {sub.id})")
            if sub.project:
                print(f"  - Project Model ID: {sub.project.id}, Status: {sub.project.status}")
                print(f"  - Team: {[m.username for m in sub.project.team.members.all()]}")

if __name__ == "__main__":
    run()
