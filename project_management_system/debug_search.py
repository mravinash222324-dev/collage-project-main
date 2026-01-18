
import os
import django
import numpy as np

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project
from project_management.project_analyzer import ProjectAnalyzer

analyzer = ProjectAnalyzer()
query = "education"
project_title = "Project Management System"

print(f"DEBUG: Checking why '{project_title}' isn't showing for query '{query}'")

# 1. content
projects = Project.objects.filter(title__icontains="Project Management")
if not projects.exists():
    print("ERROR: Project not found in DB!")
    exit()

target_project = projects.first()
print(f"Project Found: {target_project.title} (ID: {target_project.id})")
print(f"Status: {target_project.status}")

# 2. Check Embedding
sub = target_project.submission
if not sub or not sub.embedding:
    print("ERROR: No embedding found for this project!")
    # Attempt to generate
    print("Attempting to generate embedding now...")
    sub.embedding = analyzer.get_embedding(sub.abstract_text + " " + sub.title)
    sub.save()
    print("Embedding generated and saved.")
else:
    print("Embedding exists.")

# 3. Check Similarity
query_embedding = analyzer.get_embedding(query)
if not query_embedding:
    print("ERROR: Could not generate query embedding.")
    exit()

def cosine_similarity(v1, v2):
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

score = cosine_similarity(query_embedding, sub.embedding)
print(f"Similarity Score: {score}")
print(f"Threshold is 0.45. Pass? {'YES' if score > 0.45 else 'NO'}")
