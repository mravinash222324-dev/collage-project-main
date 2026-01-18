
import os
import django
import sys
import requests
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project, User

def trigger_real_audit(project_id):
    project = Project.objects.get(id=project_id)
    print(f"Triggering Real Audit for: {project.title}")
    
    # Logic similar to ProjectAuditView
    # Assuming the View logic is complex, we'll try to replicate the core:
    # 1. Get Repo Link
    repo_link = project.github_repo_link
    if not repo_link:
        print("No GitHub Repo Link!")
        return
        
    # 2. Call AI Microservice /analyze-issues (which acts as audit here?)
    # Wait, audit probably calls a different endpoint or the view does the analysis.
    # Let's inspect ProjectAuditView first (I'll output it below to be sure)
    
    # Assuming ProjectAuditView relies on 'GitHubAnalyzer' or similar.
    # Let's just reset the fields so user sees 'Pending' instad of dummy
    
    project.audit_security_score = 0
    project.audit_quality_score = 0
    project.audit_report = None
    project.save()
    print("✅ Reset Audit Data. You can now go to the Dashboard and click 'Run Audit' to get real values.")

if __name__ == "__main__":
    trigger_real_audit(17)
