import os
import django
from django.db.models import Q

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import User, ProjectSubmission, Project

try:
    # Try finding user 'avinash' or similar
    users = User.objects.filter(username__icontains='avinash')
    if not users.exists():
        print("User 'avinash' not found. Listing all users:")
        for u in User.objects.all():
            print(f"- {u.username} (ID: {u.id})")
        exit()

    for user in users:
        print(f"\n--- Projects for user: {user.username} (ID: {user.id}) ---")
        
        student_groups = user.student_groups.all()
        print(f"Student Groups: {[g.name for g in student_groups]}")

        submissions = ProjectSubmission.objects.filter(
            Q(group__in=student_groups) | 
            Q(student=user) | 
            Q(project__team__members=user)
        ).distinct().order_by('-submitted_at')

        print(f"Total Submissions Found: {submissions.count()}")
        
        for sub in submissions:
            print(f"\nSubmission ID: {sub.id}")
            print(f"Title: {sub.title}")
            print(f"Status: {sub.status}")
            print(f"Submitter: {sub.student.username}")
            if sub.group:
                print(f"Group: {sub.group.name}")
            
            # Check if it has a project
            try:
                proj = sub.project
                print(f"Associated Project ID: {proj.id}")
                print(f"Project Status: {proj.status}")
                print(f"Team Members: {[m.username for m in proj.team.members.all()]}")
            except Project.DoesNotExist:
                print("No associated Project (not approved yet?)")

except Exception as e:
    print(f"Error: {e}")
