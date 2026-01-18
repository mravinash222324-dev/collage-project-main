
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import User

u = User.objects.filter(username='TESTU').first()
if u:
    print(f'User: {u.username}, Role: {u.role}')
else:
    print('User TESTU not found')
