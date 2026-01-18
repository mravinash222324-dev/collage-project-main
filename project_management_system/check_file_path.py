import requests
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import AssignmentSubmission, User

# Get a teacher user (or admin) to simulate the request, or just query DB directly
# Querying DB directly is faster to see what's stored
submission = AssignmentSubmission.objects.filter(file__isnull=False).exclude(file='').last()

if submission:
    print(f"Submission ID: {submission.id}")
    print(f"File Field Value (DB): {submission.file}")
    print(f"File URL (Model property if any): {submission.file.url}")
else:
    print("No submissions with files found.")
