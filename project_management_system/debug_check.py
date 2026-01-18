import os
import traceback
import sys

# Add project root to path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')

import django
from django.core.management import call_command

try:
    django.setup()
    print("Django setup successful.")
    call_command('check')
    print("Check successful.")
except Exception:
    with open('traceback.txt', 'w') as f:
        traceback.print_exc(file=f)
    print("Traceback written to traceback.txt")
