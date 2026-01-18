
import os
import sys
import django

sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project_management.settings")
django.setup()

from authentication.models import User

with open("found_users.txt", "w") as f:
    f.write("Searching for users with 'avinash' in username...\n")
    users = User.objects.filter(username__icontains="avinash")
    for u in users:
        f.write(f"Username: {u.username}, ID: {u.id}, Role: {u.role}\n")

    f.write("\nListing first 10 users:\n")
    all_users = User.objects.all()[:10]
    for u in all_users:
        f.write(f"Username: {u.username}, ID: {u.id}\n")
