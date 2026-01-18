
import os
import django
import sys
import requests
import json

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import Project

def reproduction_trace():
    print("--- Debugging Audit Code Pipeline ---")
    
    # 1. Get Project Link
    try:
        project = Project.objects.get(id=17)
        link = project.github_repo_link
        print(f"Project Link: {link}")
    except:
        print("Project 17 not found")
        return

    # 2. Call AI Microservice Audit Endpoint directly
    print("\n[Step 1] Calling Microservice /audit-code...")
    url = "http://127.0.0.1:8001/audit-code"
    payload = {
        "github_repo_link": link,
        "project_context": f"Title: {project.title}"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=60)
        print(f"Status: {response.status_code}")
        
        try:
            data = response.json()
            if "error" in data:
                print(f"❌ Error in Response: {data['error']}")
                if "raw_response" in data:
                     print(f"\n--- Raw AI Response ---\n{data['raw_response']}\n-----------------------")
            else:
                print("✅ Success!")
                print("Security Score:", data.get("security_score"))
        except:
             print("❌ Response is not valid JSON")
             print(response.text[:500])
             
    except Exception as e:
        print(f"Request Exception: {e}")

if __name__ == "__main__":
    reproduction_trace()
