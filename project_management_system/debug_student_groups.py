import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import User, Group

with open('debug_groups.txt', 'w') as f:
    f.write("--- Check ALL Users ---\n")
    users = User.objects.all()
    for u in users:
        groups = u.student_groups.all()
        f.write(f"User: {u.username} (ID: {u.id}, Role: {u.role})\n")
        if groups:
            for g in groups:
                 f.write(f"  - Member of Group: {g.name} (ID: {g.id})\n")
        else:
             f.write("  - NO GROUPS\n")
    print("Done writing to debug_groups.txt")
