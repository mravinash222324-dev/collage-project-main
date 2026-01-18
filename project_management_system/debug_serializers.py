import os
import django
from django.conf import settings

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

try:
    from authentication import serializers
    print("Serializers imported successfully!")
except Exception as e:
    import traceback
    traceback.print_exc()
