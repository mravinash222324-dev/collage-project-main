
import os
import django
import numpy as np

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project
from project_management.project_analyzer import ProjectAnalyzer

analyzer = ProjectAnalyzer()
query = "education"

# Check Project 17: "ai project manager"
try:
    p17 = Project.objects.get(id=17)
    print(f"--- Checking Project 17: '{p17.title}' ---")
    print(f"Status: {p17.status}")
    if p17.submission and p17.submission.embedding:
        emb = p17.submission.embedding
        q_emb = analyzer.get_embedding(query)
        
        def cosine_similarity(v1, v2):
             return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
             
        score = cosine_similarity(q_emb, emb)
        print(f"Similarity with '{query}': {score}")
    else:
        print("No embedding found.")
except Project.DoesNotExist:
    print("Project 17 not found.")

# Check Project 12: "PROJECT MANAGERR"
try:
    p12 = Project.objects.get(id=12)
    print(f"\n--- Checking Project 12: '{p12.title}' ---")
    print(f"Status: {p12.status}")
    if p12.status != 'Completed':
        print("ISSUE: Project is NOT Completed, so it wont appear in search.")
except Project.DoesNotExist:
    print("Project 12 not found.")
