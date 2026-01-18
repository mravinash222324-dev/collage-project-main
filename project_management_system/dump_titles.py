
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project

with open('all_titles.txt', 'w') as f:
    for p in Project.objects.all():
        f.write(f"{p.id}: {p.title} [{p.status}]\n")
