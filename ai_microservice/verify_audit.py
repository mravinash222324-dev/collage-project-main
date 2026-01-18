import requests
import json
import time
from datetime import datetime

def test_audit_endpoint():
    url = "http://127.0.0.1:8001/audit-code"
    payload = {
        "github_repo_link": "https://github.com/octocat/Hello-World",
        "project_context": "Test Project for Audit Verification"
    }

    print(f"Sending request to {url}...")
    start_time = time.time()
    try:
        response = requests.post(url, json=payload, timeout=60)
        end_time = time.time()
        
        print(f"Reference Time: {end_time - start_time:.2f}s")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            data["execution_time"] = datetime.now().isoformat()
            with open("audit_result.json", "w") as f:
                json.dump(data, f, indent=2)
            print("Response saved to audit_result.json")
        else:
            print("Failed Response:", response.text)
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_audit_endpoint()
