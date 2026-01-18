import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project, User, Team, ProjectSubmission

try:
    project_id = 18
    print(f"--- Debugging Project {project_id} ---")
    
    try:
        project = Project.objects.get(id=project_id)
        print(f"✅ Project Found: '{project.title}' (Status: {project.status})")
    except Project.DoesNotExist:
        print("❌ Project 18 DOES NOT EXIST.")
        sys.exit()

    # 1. Check Owner/Student
    try:
        owner = project.submission.student
        print(f"👤 Owner (Student): {owner.username} (ID: {owner.id})")
    except Exception as e:
        print(f"❌ Owner Check Failed: {e}")

    # 2. Check Team
    try:
        team = project.team
        members = team.members.all()
        print(f"👥 Team Found: ID {team.id}")
        print(f"   Members ({members.count()}):")
        for m in members:
            print(f"    - {m.username} (ID: {m.id}, Role: {m.role})")
    except Exception as e:
        print(f"⚠️ Team Check Failed: {e} (Project might be orphan or using old logic)")

    # 3. Check Group/Teachers
    try:
        group = project.submission.group
        if group:
            print(f"🏫 Group: '{group.name}'")
            teachers = group.teachers.all()
            print(f"   Teachers ({teachers.count()}):")
            for t in teachers:
                print(f"    - {t.username} (ID: {t.id})")
        else:
            print("⚠️ No Group assigned to submission.")
    except Exception as e:
        print(f"⚠️ Group Check Failed: {e}")

except Exception as e:
    print(f"CRITICAL ERROR: {e}")
