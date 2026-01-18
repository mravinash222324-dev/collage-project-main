import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import AssignmentSubmission
try:
    sub = AssignmentSubmission.objects.last()
    if sub:
        print(f"ID: {sub.id}")
        print(f"Feedback: {sub.ai_feedback}")
        print(f"Score: {sub.ai_score}")
    else:
        print("No submissions found.")
except Exception as e:
    print(f"Error: {e}")
