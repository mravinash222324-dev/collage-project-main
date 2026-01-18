
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project_management.settings")
django.setup()

from authentication.models import Team, Project

def fix_teams():
    print("--- Starting Team Member Fix ---")
    teams = Team.objects.all()
    count = 0
    updated_teams = 0
    
    for team in teams:
        count += 1
        project = team.project
        submission = project.submission
        
        if submission.group:
            print(f"Checking Team for Project: {project.title} (Group: {submission.group.name})")
            
            group_students = submission.group.students.all()
            initial_count = team.members.count()
            
            for student in group_students:
                if not team.members.filter(id=student.id).exists():
                    team.members.add(student)
                    print(f"  -> Added student: {student.username}")
            
            final_count = team.members.count()
            if final_count > initial_count:
                updated_teams += 1
                print(f"  -> Updated member count from {initial_count} to {final_count}")
        else:
            print(f"Skipping Project: {project.title} (No Group)")

    print(f"\n--- DONE ---")
    print(f"Processed {count} teams.")
    print(f"Updated {updated_teams} teams.")

if __name__ == "__main__":
    fix_teams()
