import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()
from authentication.models import User, VivaSession, ProjectSubmission, Project
u = User.objects.get(username='TESTU')
tg = u.teaching_groups.all()
pending = ProjectSubmission.objects.filter(group__in=tg, status='Submitted').exclude(group__project__status__in=['In Progress', 'Completed']).count()
vivas = VivaSession.objects.filter(project__submission__group__in=tg).count()
print(f'PENDING:{pending}|VIVAS:{vivas}')
