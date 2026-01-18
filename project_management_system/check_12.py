
import os
import django
import numpy as np

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project
from project_management.project_analyzer import ProjectAnalyzer

analyzer = ProjectAnalyzer()
query = "education"

try:
    p = Project.objects.get(id=12)
    print(f"Project: {p.title}")
    
    if p.submission and p.submission.embedding:
        emb = p.submission.embedding
        q_emb = analyzer.get_embedding(query)
        
        def cosine_similarity(v1, v2):
             return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

        score = cosine_similarity(q_emb, emb)
        print(f"Similarity Score: {score}")
    else:
        print("No embedding.")
except Exception as e:
    print(e)
