
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project, Group, User, ProjectSubmission

with open('final_audit.txt', 'w', encoding='utf-8') as f:
    f.write('--- SYSTEM CHECK ---\n')
    f.write(f'Total Users: {User.objects.count()}\n')
    f.write(f'Total Groups: {Group.objects.count()}\n')
    f.write(f'Total Projects: {Project.objects.count()}\n\n')

    f.write('--- ALL PROJECTS AUDIT ---\n')
    projects = Project.objects.all()
    f.write(f'Found {projects.count()} total projects.\n\n')

    for p in projects:
        g = p.submission.group
        status = p.status
        if g:
            teachers = [(t.username, t.role, t.id) for t in g.teachers.all()]
            f.write(f'Title: {p.title}\n')
            f.write(f'  Status: {status}\n')
            f.write(f'  Group: {g.name}\n')
            f.write(f'  Teachers (User, Role, ID): {teachers}\n')
        else:
            f.write(f'Title: {p.title}\n')
            f.write(f'  Status: {status}\n')
            f.write(f'  Group: None\n')

    f.write('\n--- SUBMISSIONS AUDIT ---\n')
    submissions = ProjectSubmission.objects.all()
    for ps in submissions:
        g = ps.group
        f.write(f'Title: {ps.title}\n')
        f.write(f'  Status: {ps.status}\n')
        f.write(f'  Group: {g.name if g else "None"}\n')
        if g:
            teachers = [t.username for t in g.teachers.all()]
            f.write(f'  Teachers: {teachers}\n')

    f.write('\n--- GROUPS AND PROJECTS AUDIT ---\n')
    for g in Group.objects.all():
        ps_list = g.projectsubmission_set.all()
        project_objs = Project.objects.filter(submission__in=ps_list)
        project_titles = [f'{p.title} ({p.status})' for p in project_objs]
        teachers = [t.username for t in g.teachers.all()]
        f.write(f'Group: {g.name}\n')
        f.write(f'  Teachers: {teachers}\n')
        f.write(f'  Projects: {project_titles}\n')
