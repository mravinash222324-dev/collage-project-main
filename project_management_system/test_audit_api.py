
import requests
import json

def test_audit_endpoint():
    url = "http://127.0.0.1:8001/audit-code"
    payload = {
        "github_repo_link": "https://github.com/octocat/Hello-World",
        "project_context": "A simple test project."
    }
    
    print(f"Testing {url}...")
    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        try:
            data = response.json()
            print("Response JSON keys:", data.keys())
            if "error" in data:
                print("Error from API:", data["error"])
            else:
                print("Success! Score:", data.get("security_score"))
        except json.JSONDecodeError:
            print("Failed to decode JSON. Raw response:")
            print(response.text[:500])
            
    except Exception as e:
        print(f"Request failed: {str(e)}")

if __name__ == "__main__":
    test_audit_endpoint()
