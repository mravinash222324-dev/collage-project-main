
import os
import django
import sys
import json

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project, User, Group
from project_management.mcp_server import get_project_audit, get_group_details, get_student_project_context

def debug_tools(username):
    print(f"--- Debugging for User: {username} ---")
    
    user = User.objects.get(username=username)
    print(f"User ID: {user.id}")
    
    # 1. Check Project Context Logic
    print("\n[Tool: get_student_project_context]")
    res_ctx = get_student_project_context(username)
    print("Result:", res_ctx)
    
    # Check Manual DB State for Project
    proj = Project.objects.exclude(audit_security_score=0).last() # Try to find ANY project with audit
    if proj:
         print(f"\nDB State - Found Project with Audit: ID={proj.id}, User={proj.submission.student.username}, SecScore={proj.audit_security_score}")
    
    # 2. Check Audit Logic
    print("\n[Tool: get_project_audit]")
    res_audit = get_project_audit(username)
    print("Result:", res_audit)
    
    # 3. Check Group Logic
    print("\n[Tool: get_group_details]")
    res_group = get_group_details(username)
    print("Result:", res_group)
    
    # Manual Group Check
    groups = user.student_groups.all()
    print(f"\nManual Group Check: User is in {groups.count()} groups: {[g.name for g in groups]}")

if __name__ == "__main__":
    debug_tools("AVINASH1")
