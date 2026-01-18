
import os
import django
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project

def check_link(pid):
    try:
        p = Project.objects.get(id=pid)
        print(f"Project: {p.title}")
        print(f"GitHub Link: '{p.github_repo_link}'")
        
        if not p.github_repo_link:
             print("❌ ERROR: No Link!")
        elif "github.com" not in p.github_repo_link:
             print("❌ ERROR: Invalid Link format!")
        else:
             print("✅ Link looks valid (syntax check only).")
             
    except Project.DoesNotExist:
        print("Project not found.")

if __name__ == "__main__":
    check_link(17)
