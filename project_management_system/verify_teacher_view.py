
import os
import sys
import django

sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project_management.settings")
django.setup()

from authentication.models import User, ProjectSubmission, Project

teacher_id = 17
try:
    teacher = User.objects.get(id=teacher_id)
    print(f"Teacher: {teacher.username}")
    
    teaching_groups = teacher.teaching_groups.all()
    print(f"Teaching Groups: {[g.name for g in teaching_groups]}")
    
    # Simulate View Logic
    queryset = ProjectSubmission.objects.filter(group__in=teaching_groups).order_by('-submitted_at')
    
    submissions = queryset.filter(status='Submitted')
    
    print(f"Visible Submissions in Dashboard ({submissions.count()}):")
    for s in submissions:
        print(f" - ID: {s.id}, Title: {s.title}, Group: {s.group.name if s.group else 'None'}")
        
except User.DoesNotExist:
    print("Teacher not found.")
