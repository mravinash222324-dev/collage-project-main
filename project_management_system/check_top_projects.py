
import os
import django
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project

# Replicating the view's query
projects = Project.objects.filter(
    status__in=['Completed', 'Archived']
).order_by('-submission__innovation_score', '-submission__relevance_score', '-submission__submitted_at')

print(f"Total candidates: {projects.count()}")
print(f"Top 10 would be:")
print(f"{'ID':3} | {'Submitted At':20} | {'Title'}")
print("-" * 60)
for p in projects[:15]:
    sub_date = p.submission.submitted_at.strftime('%Y-%m-%d %H:%M') if p.submission and p.submission.submitted_at else "N/A"
    print(f"{p.id:3} | {sub_date:20} | {p.title}")
