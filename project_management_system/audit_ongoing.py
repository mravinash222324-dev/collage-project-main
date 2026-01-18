
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project, Group, User, ProjectSubmission

print('--- SYSTEM CHECK ---')
print(f'Total Users: {User.objects.count()}')
print(f'Total Groups: {Group.objects.count()}')
print(f'Total Projects: {Project.objects.count()}')

print('\n--- ALL PROJECTS AUDIT ---')
projects = Project.objects.all()
print(f'Found {projects.count()} total projects.\n')

for p in projects:
    g = p.submission.group
    status = p.status
    if g:
        teachers = [t.username for t in g.teachers.all()]
        print(f'Title: {p.title}')
        print(f'  Status: {status}')
        print(f'  Group: {g.name}')
        print(f'  Teachers: {teachers}')
    else:
        print(f'Title: {p.title}')
        print(f'  Status: {status}')
        print(f'  Group: None')

print('\n--- SUBMISSIONS AUDIT ---')
submissions = ProjectSubmission.objects.all()
for ps in submissions:
    g = ps.group
    print(f'Title: {ps.title}')
    print(f'  Status: {ps.status}')
    print(f'  Group: {g.name if g else "None"}')
    if g:
        print(f'  Teachers: {[t.username for t in g.teachers.all()]}')
