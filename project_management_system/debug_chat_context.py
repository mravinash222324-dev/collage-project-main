import os
import django
import sys

# Add the current directory to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import User, Project, Team

def check_user_projects(username_query):
    print(f"--- Checking for user matching '{username_query}' ---")
    user = User.objects.filter(username__icontains=username_query).first()
    
    if not user:
        print("User not found.")
        return

    print(f"User Found: {user.username} (ID: {user.id})")
    
    # 1. Check Projects where user is the Submitter
    submitted_projects = Project.objects.filter(submission__student=user)
    print(f"\n[Submitted Projects] (submission.student = user):")
    for p in submitted_projects:
        print(f" - ID: {p.id} | Title: {p.title} | Status: {p.status}")

    # 2. Check Projects where user is in the Team
    team_projects = Project.objects.filter(team__members=user)
    print(f"\n[Team Projects] (team.members contains user):")
    for p in team_projects:
        print(f" - ID: {p.id} | Title: {p.title} | Status: {p.status}")

    # 3. Check All Projects in user's Group (Fallback check)
    # Finding groups
    groups = user.student_groups.all()
    print(f"\n[User Groups]: {[g.name for g in groups]}")
    
    for group in groups:
        group_projects = Project.objects.filter(submission__group=group)
        print(f"  > Projects in Group '{group.name}':")
        for p in group_projects:
            print(f"    - ID: {p.id} | Title: {p.title} | Status: {p.status}")
            # Check if Team object exists
            if hasattr(p, 'team'):
                members = p.team.members.all()
                member_names = [m.username for m in members]
                print(f"      Team Members: {member_names}")
                if user not in members:
                    print(f"      *** WARNING: User is in group but NOT in Project Team! ***")
            else:
                print(f"      *** WARNING: Project has NO Team object! ***")

if __name__ == "__main__":
    check_user_projects('avinash')
