import os
import django
import random
from datetime import timedelta
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import User, ProjectSubmission, Project, Team

def seed_alumni():
    print("Seeding dummy alumni projects...")
    
    # 1. Ensure we have an alumni user
    alumni_user, created = User.objects.get_or_create(
        username='alumni_hero',
        defaults={
            'email': 'alumni@example.com',
            'first_name': 'Alumni',
            'last_name': 'Hero',
            'role': 'Student'
        }
    )
    if created:
        alumni_user.set_password('password123')
        alumni_user.save()
        print(f"Created alumni user: {alumni_user.username}")

    # 2. Dummy Project Data
    projects_data = [
        {
            "title": "Quantum Cryptography for IoT",
            "abstract": "Developing ultra-secure communication protocols for low-power IoT devices using post-quantum cryptographic algorithms.",
            "category": "Cybersecurity",
            "innovation": 9.8,
            "relevance": 9.5,
            "days_ago": 2
        },
        {
            "title": "Sustainable Smart Cities with AI",
            "abstract": "Using deep learning and sensor fusion to optimize energy consumption and waste management in urban environments.",
            "category": "Machine Learning",
            "innovation": 9.2,
            "relevance": 9.7,
            "days_ago": 5
        },
        {
            "title": "DeFi Lending Protocol on Polygon",
            "abstract": "A decentralized finance protocol that enables peer-to-peer lending with automated collateral management and low gas fees.",
            "category": "Web Development",
            "innovation": 8.5,
            "relevance": 9.8,
            "days_ago": 1
        },
        {
            "title": "Autonomous Drone Reforestation",
            "abstract": "Swarm-based drone system designed to autonomously map deforested areas and plant seeds with high precision.",
            "category": "Other",
            "innovation": 9.9,
            "relevance": 8.8,
            "days_ago": 10
        },
        {
            "title": "Privacy-Preserving Healthcare Analytics",
            "abstract": "Implementing federated learning to allow hospitals to train diagnostic models without sharing sensitive patient data.",
            "category": "Machine Learning",
            "innovation": 9.0,
            "relevance": 9.9,
            "days_ago": 3
        },
        {
            "title": "Real-time AR Education Platform",
            "abstract": "An augmented reality application that brings complex biological and physical concepts to life for K-12 students.",
            "category": "Mobile App",
            "innovation": 8.7,
            "relevance": 8.5,
            "days_ago": 15
        },
        {
            "title": "Low-Code AI Platform for SME",
            "abstract": "Simplifying the integration of AI models for small businesses without the need for extensive coding knowledge.",
            "category": "Web Development",
            "innovation": 8.2,
            "relevance": 9.2,
            "days_ago": 7
        },
        {
            "title": "Edge Computing for Self-Driving Cars",
            "abstract": "Optimizing latency-sensitive decision-making processes in autonomous vehicles using edge-based neural network accelerators.",
            "category": "Other",
            "innovation": 9.5,
            "relevance": 9.3,
            "days_ago": 12
        }
    ]

    for data in projects_data:
        # Create Submission
        submission = ProjectSubmission.objects.create(
            student=alumni_user,
            title=data['title'],
            abstract_text=data['abstract'],
            status='Completed',
            innovation_score=data['innovation'],
            relevance_score=data['relevance'],
            submitted_at=timezone.now() - timedelta(days=data['days_ago']),
            ai_summary=f"This project on {data['title']} is highly {data['category']} focused."
        )
        # Update submitted_at manually because auto_now_add=True
        ProjectSubmission.objects.filter(id=submission.id).update(submitted_at=timezone.now() - timedelta(days=data['days_ago']))
        
        # Create Project
        project = Project.objects.create(
            submission=submission,
            title=data['title'],
            abstract=data['abstract'],
            category=data['category'],
            status='Completed',
            progress_percentage=100,
            is_alumni=True,
            trend_score=random.uniform(7.0, 9.9)
        )
        
        # Create Team
        team = Team.objects.create(project=project)
        team.members.add(alumni_user)
        
        print(f"Seeded: {data['title']} (Rank Potential: {data['relevance']})")

    print("Seeding complete!")

if __name__ == "__main__":
    seed_alumni()
