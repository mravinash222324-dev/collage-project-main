import os
import sys
import django

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import User

def check():
    try:
        u = User.objects.get(username='avinash')
        print(f"User: {u.username}")
        groups = list(u.student_groups.all())
        for g in groups:
            assigns = list(g.assignments.all())
            print(f"Group '{g.name}' Assignments:")
            for a in assigns:
                print(f"  - ID: {a.id}, Title: {a.title}, Active: {a.is_active}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
