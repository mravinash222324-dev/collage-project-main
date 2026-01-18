
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project

try:
    p = Project.objects.get(id=12)
    print(f"Updating ID 12: {p.title}")
    p.title = "Project Management System"
    p.status = "Completed"
    p.save()
    
    if p.submission:
        p.submission.status = "Completed"
        p.submission.save()
        
    print("Updated ID 12 to 'Project Management System' and 'Completed'.")
except Exception as e:
    print(f"Error: {e}")
