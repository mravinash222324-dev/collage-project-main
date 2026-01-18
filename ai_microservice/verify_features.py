
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8001"

# We use a public repo for testing. 'octocat/Spoon-Knife' is common.
TEST_REPO = "https://github.com/octocat/Spoon-Knife"
PROJECT_CONTEXT = "This is a test project for forking and collaboration."

def run_test(name, endpoint, payload):
    print(f"\n--- Testing {name} ({endpoint}) ---")
    start = time.time()
    try:
        response = requests.post(f"{BASE_URL}{endpoint}", json=payload)
        duration = time.time() - start
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success ({duration:.2f}s)")
            
            # Print a snippet of the result
            if "markdown_content" in data:
                print(f"Result Snippet:\n{data['markdown_content'][:200]}...")
            elif "analysis" in data:
                print(f"Result Snippet:\n{data['analysis'][:200]}...")
            elif "issues" in data:
                 print(f"Issues Found: {len(data['issues'])}")
            else:
                 print(f"Result: {str(data)[:200]}...")
                 
        else:
            print(f"❌ Failed ({response.status_code}): {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print(f"target: {TEST_REPO}")
    print("Ensure 'python main.py' is running on port 8001!")
    
    payload = {
        "github_repo_link": TEST_REPO,
        "project_context": PROJECT_CONTEXT
    }

    # 1. Test Audit (Smart Agentic Audit)
    run_test("Live Audit", "/audit-code", payload)

    # 2. Test Auto-Docs (README Generator)
    run_test("Auto Documentation", "/generate-docs", payload)
    
    # 3. Test Issue Analysis (Fetch & Categorize)
    # Note: Spoon-Knife might have many issues, or zero.
    run_test("Issue Analysis", "/analyze-issues", payload)
