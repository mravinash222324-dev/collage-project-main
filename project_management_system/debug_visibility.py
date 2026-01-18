import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()
from authentication.models import User, Group, ProjectSubmission, Project

def dump_state():
    with open('visibility_debug.txt', 'w', encoding='utf-8') as f:
        f.write("--- Recent Submissions ---\n")
        subs = ProjectSubmission.objects.all().order_by('-submitted_at')[:10]
        for s in subs:
            g_name = s.group.name if s.group else "None"
            teachers = [t.username for t in s.group.teachers.all()] if s.group else []
            f.write(f"ID: {s.id} | Title: {s.title} | Student: {s.student.username} | Group: {g_name} | Status: {s.status} | Teachers: {teachers}\n")

        f.write("\n--- Recent Projects ---\n")
        projs = Project.objects.all().order_by('-id')[:10]
        for p in projs:
            g = p.submission.group
            teachers = [t.username for t in g.teachers.all()] if g else []
            f.write(f"ID: {p.id} | Title: {p.title} | Sub_ID: {p.submission.id} | Status: {p.status} | Teachers: {teachers}\n")

        f.write("\n--- Recent Groups ---\n")
        groups = Group.objects.all().order_by('-id')[:5]
        for g in groups:
            teachers = [t.username for t in g.teachers.all()]
            students = [s.username for s in g.students.all()]
            f.write(f"ID: {g.id} | Name: {g.name} | Teachers: {teachers} | Students: {students}\n")

if __name__ == "__main__":
    dump_state()
