
import os
import django
import numpy as np

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project
from project_management.project_analyzer import ProjectAnalyzer

analyzer = ProjectAnalyzer()
query = "education"

print("Checking 'Project Management System' similarity...")
projects = Project.objects.filter(title__icontains="Project Management", status='Completed')

if not projects.exists():
    print("Project still not Completed or found!")
    exit()

project = projects.first()
emb = project.submission.embedding
q_emb = analyzer.get_embedding(query)

def cosine_similarity(v1, v2):
     return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

score = cosine_similarity(q_emb, emb)
print(f"Project: {project.title}")
print(f"Score with 'education': {score}")
