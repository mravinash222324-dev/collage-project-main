
import os
import sys
import django
import json

sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project_management.settings")
django.setup()

from authentication.models import ProjectSubmission

title_fragment = "Jarvi"
submissions = ProjectSubmission.objects.filter(title__icontains=title_fragment)


with open("jarvi_debug.txt", "w") as f:
    f.write(f"Found {submissions.count()} submissions matching '{title_fragment}'\n")

    for sub in submissions:
        f.write(f"\n--- Submission ID: {sub.id} ---\n")
        f.write(f"Title: {sub.title}\n")
        f.write(f"AI Summary: {sub.ai_summary}\n")
        f.write(f"AI Suggested Features: {sub.ai_suggested_features}\n")
        
        if sub.ai_similarity_report:
            f.write("AI Similarity Report (JSON):\n")
            f.write(json.dumps(sub.ai_similarity_report, indent=2))
            f.write("\n")
        else:
            f.write("AI Similarity Report: None\n")

