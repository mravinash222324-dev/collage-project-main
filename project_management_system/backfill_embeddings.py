
import os
import django
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import ProjectSubmission
from project_management.project_analyzer import ProjectAnalyzer

analyzer = ProjectAnalyzer()
submissions = ProjectSubmission.objects.all()

print(f"Found {submissions.count()} submissions. Checking for missing embeddings...")

for sub in submissions:
    if sub.embedding:
        print(f"Skipping {sub.title} (already has embedding)")
        continue
        
    print(f"Generating embedding for: {sub.title}")
    text_to_analyze = sub.abstract_text or sub.title
    try:
        emb = analyzer.get_embedding(text_to_analyze)
        if emb:
            sub.embedding = emb
            sub.save()
            print("  -> Saved!")
        else:
            print("  -> Failed to generate embedding.")
        
        time.sleep(1) # Rate limit protection
    except Exception as e:
        print(f"  -> Error: {e}")

print("Done.")
