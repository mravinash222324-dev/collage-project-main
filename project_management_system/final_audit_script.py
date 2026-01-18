from authentication.models import User, VivaSession, ProjectSubmission, Project
from django.utils import timezone
import os

def audit():
    now = timezone.now()
    results = []
    for u in User.objects.filter(role__in=['Teacher', 'HOD/Admin']):
        t_groups = u.teaching_groups.all()
        sub_count = ProjectSubmission.objects.filter(group__in=t_groups, status='Submitted').exclude(group__project__status__in=['In Progress', 'Completed']).count()
        proj_count = Project.objects.filter(submission__group__in=t_groups, status='In Progress').count()
        viva_count = VivaSession.objects.filter(project__submission__group__in=t_groups).count()
        
        results.append(f"User: {u.username} | Pending: {sub_count} | Active: {proj_count} | Vivas: {viva_count}")
    
    unappointed_ongoing = Project.objects.filter(submission__group__teachers__isnull=True, status='In Progress').count()
    results.append(f"Global Unappointed Ongoing: {unappointed_ongoing}")
    
    with open('final_audit.txt', 'w') as f:
        f.write('\n'.join(results))

audit()
