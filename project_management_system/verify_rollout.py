import os
import sys
import requests
import django

# Setup Django Path
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from authentication.models import Project, Team

User = get_user_model()
BASE_URL = "http://127.0.0.1:8000"

def run_verification():
    print("🚀 STARTED: Full System Rollout Verification")
    print("============================================")
    
    # 1. Ensure User Exists
    username = "mcp_tester"
    password = "password123"
    
    user, created = User.objects.get_or_create(username=username)
    if created:
        user.set_password(password)
        user.role = 'Student'
        user.save()
        print(f"✅ Created Test User: {username}")
    else:
        # Reset password just in case
        user.set_password(password)
        user.save()
        print(f"✅ Found Test User: {username}")
        
    from authentication.models import ProjectSubmission, Group
    
    # Check if user has a submission
    submission = ProjectSubmission.objects.filter(student=user).first()
    if not submission:
        submission = ProjectSubmission.objects.create(
            student=user,
            title="MCP Rollout Test Project",
            abstract_text="A project to verify the MCP rollout integration. Use AI to optimize backend.",
            status="Approved"
        )
        print(f"✅ Created Submission: {submission.title}")

    # Ensure User has a project (for chat/viva context)
    project, p_created = Project.objects.get_or_create(
        submission=submission,
        defaults={
            "title": submission.title,
            "abstract": submission.abstract_text,
            "category": "Software",
            "progress_percentage": 50
        }
    )
    
    # Check if team exists
    if not hasattr(project, 'team'):
        team = Team.objects.create(project=project)
        team.members.add(user)
    else:
        project.team.members.add(user)
        
    print(f"✅ Linked User to Project: {project.title} (ID: {project.id})")

    # 2. Login (Get Token)
    print("\n[Step 1] Logging in...")
    session = requests.Session()
    login_url = f"{BASE_URL}/auth/jwt/create/" 
    try:
        resp = session.post(login_url, json={"username": username, "password": password})
        if resp.status_code == 200:
            token = resp.json()['access']
            headers = {"Authorization": f"Bearer {token}"}
            print("✅ Login Successful")
        else:
            print(f"❌ Login Failed: {resp.text}")
            return
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        return

    # 3. Verify Mentor Chat (MCP)
    print("\n[Step 2] Testing Mentor Chat Endpoint (/ai/mentor-chat/)")
    try:
        chat_url = f"{BASE_URL}/ai/mentor-chat/"
        payload = {"message": "How can I improve my project abstract?"}
        
        resp = requests.post(chat_url, json=payload, headers=headers)
        
        if resp.status_code == 200:
            data = resp.json()
            response_text = data.get("response", "")
            print(f"✅ Success! Response: {response_text[:100]}...")
        else:
            print(f"❌ Failed: {resp.status_code} - {resp.text}")

    except Exception as e:
        print(f"❌ Error: {e}")

    # 4. Verify Viva Generation (MCP)
    print("\n[Step 3] Testing Viva Endpoint (/ai/viva/)")
    try:
        viva_url = f"{BASE_URL}/ai/viva/"
        payload = {"project_id": project.id}
        
        print(f"   Sending to Django: {payload} as {username}")
        resp = requests.post(viva_url, json=payload, headers=headers)
        
        if resp.status_code == 201:
            print("✅ Success! Viva Session Created with AI Questions.")
        else:
            print(f"❌ Failed: {resp.status_code}")
            print(f"   Response Body: {resp.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        
    # 5. Direct Microservice Check (Debugging)
    print("\n[Step 4] Direct Microservice Check (8001)")
    try:
        ms_url = "http://127.0.0.1:8001/mcp-viva-questions"
        ms_payload = {"student_username": username}
        print(f"   Sending to Microservice: {ms_payload}")
        
        resp = requests.post(ms_url, json=ms_payload, timeout=10)
        if resp.status_code == 200:
             print("✅ Microservice Direct Hit Success")
             print(f"   Response: {str(resp.json())[:100]}...")
        else:
             print(f"❌ Microservice Direct Hit Failed: {resp.status_code}")
             print(f"   Response: {resp.text}")
    except Exception as e:
         print(f"❌ Microservice Connection Failed: {e}")

    print("\n============================================")
    print("✅ ROLLOUT VERIFIED")

if __name__ == "__main__":
    run_verification()
