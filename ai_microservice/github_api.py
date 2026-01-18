
import os
import requests
import base64
import time
from dotenv import load_dotenv

load_dotenv()

GITHUB_API_BASE = "https://api.github.com"

def get_headers():
    token = os.getenv("GITHUB_ACCESS_TOKEN")
    if not token:
        print("⚠️ WARNING: No GITHUB_ACCESS_TOKEN found. Rate limits will be very low (60/hr).")
        return {}
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json"
    }

def get_repo_structure(repo_url, branch=None):
    """
    Fetches the flat file listing (tree) of a repository.
    Extracts owner/repo from url.
    Automatically detects default branch if none provided.
    """
    try:
        # Extract owner/repo
        clean_url = repo_url.replace("https://github.com/", "").replace(".git", "")
        if "/tree/" in clean_url:
            clean_url = clean_url.split("/tree/")[0]
        parts = clean_url.strip().split("/")
        if len(parts) < 2:
            return {"error": "INVALID_URL", "message": "Invalid GitHub URL format"}
        
        owner, repo = parts[0], parts[1]
        headers = get_headers()

        # 0. Detect Default Branch if not provided
        if not branch:
            repo_info_url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}"
            repo_resp = requests.get(repo_info_url, headers=headers)
            if repo_resp.status_code == 200:
                branch = repo_resp.json().get("default_branch", "main")
            else:
                branch = "main" # Fallback

        # 1. Get the SHA of the branch recursive tree
        api_url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
        
        response = requests.get(api_url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            data["detected_branch"] = branch
            return data
        elif response.status_code == 404:
            return {"error": "NOT_FOUND", "message": f"Repository or branch '{branch}' not found"}
        elif response.status_code == 403:
             return {"error": "RATE_LIMITED", "message": "GitHub API rate limit exceeded"}
        else:
            return {"error": "GITHUB_ERROR", "message": f"GitHub API Error: {response.status_code}"}

    except Exception as e:
        return {"error": "EXCEPTION", "message": str(e)}

def get_file_content(repo_url, file_path):
    """
    Fetches raw content of a specific file.
    """
    try:
        clean_url = repo_url.replace("https://github.com/", "").replace(".git", "")
        parts = clean_url.split("/")
        owner, repo = parts[0], parts[1]
        
        api_url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{file_path}"
        
        response = requests.get(api_url, headers=get_headers())
        
        if response.status_code == 200:
            data = response.json()
            if "content" in data and data.get("encoding") == "base64":
                content = base64.b64decode(data["content"]).decode('utf-8', errors='replace')
                return {"path": file_path, "content": content}
            elif "size" in data and data["size"] > 1000000:
                 return {"path": file_path, "content": "(File too large to display)"}
            else:
                 # Download url might be needed for non-base64
                 download_url = data.get("download_url")
                 if download_url:
                     r = requests.get(download_url)
                     return {"path": file_path, "content": r.text}
                 return {"error": "Could not decode file content"}
                 
        else:
            return {"error": f"Could not fetch file: {response.status_code}"}
            
    except Exception as e:
        return {"error": str(e)}


def search_repo(repo_url, query):
    """
    Searches for code within the repo using GitHub Search API.
    """
    try:
        clean_url = repo_url.replace("https://github.com/", "").replace(".git", "")
        if "/tree/" in clean_url:
            clean_url = clean_url.split("/tree/")[0]
        clean_url = clean_url.strip().rstrip("/")
        
        # Searching requires a specific strict query format
        api_url = f"{GITHUB_API_BASE}/search/code?q={query}+repo:{clean_url}"
        
        response = requests.get(api_url, headers=get_headers())
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 403:
             return {"error": "RATE_LIMITED", "message": "Search rate limit exceeded. GitHub Search API is very strict."}
        elif response.status_code == 422:
             return {"error": "INVALID_QUERY", "message": f"Query '{query}' is invalid for GitHub Search."}
        else:
             return {"error": "GITHUB_ERROR", "message": f"Search failed: {response.status_code}"}

    except Exception as e:
        return {"error": "EXCEPTION", "message": str(e)}

def validate_repo(repo_url):
    """
    Checks if the repo exists and has code files.
    Returns: {"valid": Bool, "error": str}
    """
    cleaned_url = repo_url.replace("https://github.com/", "").replace(".git", "")
    parts = cleaned_url.split("/")
    if len(parts) < 2:
        return {"valid": False, "error": "Invalid GitHub URL"}
    
    owner, repo = parts[0], parts[1]
    api_url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}"
    
    try:
        resp = requests.get(api_url, headers=get_headers())
        if resp.status_code == 404:
            return {"valid": False, "error": "Repository not found on GitHub."}
        if resp.status_code == 200:
            data = resp.json()
            if data.get("size", 0) == 0:
                return {"valid": False, "error": "Repository is empty."}
            return {"valid": True, "size": data.get("size")}
            
        return {"valid": False, "error": f"GitHub API check failed: {resp.status_code}"}
    except Exception as e:
        return {"valid": False, "error": f"Validation Error: {str(e)}"}

def get_issues(repo_url, state="open"):
    """
    Fetches issues from the repository.
    """
    clean_url = repo_url.replace("https://github.com/", "").replace(".git", "")
    api_url = f"{GITHUB_API_BASE}/repos/{clean_url}/issues?state={state}&per_page=10"
    
    try:
        response = requests.get(api_url, headers=get_headers())
        if response.status_code == 200:
            return response.json()
        return []

    except:
        return []

def fork_repo(repo_url):
    """
    Forks the given repo to the authenticated user's account.
    Returns: {"owner": "new_owner", "repo": "repo_name", "clone_url": "..."}
    """
    clean_url = repo_url.replace("https://github.com/", "").replace(".git", "")
    owner, repo = clean_url.split("/")[:2]
    
    api_url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/forks"

    try:
        resp = requests.post(api_url, headers=get_headers())
        if resp.status_code in [200, 202]: # 202 is "Accepted" (async)
            data = resp.json()
            return data # Contains 'owner' object, 'full_name', etc.
        
        print(f"Fork Failed Error: {resp.status_code} - {resp.text}") # Terminal Log
        return {"error": f"Fork failed: {resp.status_code} - {resp.text}"}
    except Exception as e:
        return {"error": str(e)}

def create_branch(repo_full_name, new_branch_name, base_branch="main"):
    """
    Creates a new branch in the specified repo (owner/repo).
    """
    # 1. Get SHA of base branch
    api_url = f"{GITHUB_API_BASE}/repos/{repo_full_name}/git/ref/heads/{base_branch}"
    try:
        resp = requests.get(api_url, headers=get_headers())
        if resp.status_code != 200:
             # Try 'master' if main fails
             if base_branch == "main":
                 return create_branch(repo_full_name, new_branch_name, base_branch="master")
             return {"error": f"Could not find base branch {base_branch}"}
             
        sha = resp.json()["object"]["sha"]
        
        # 2. Create new reference
        create_url = f"{GITHUB_API_BASE}/repos/{repo_full_name}/git/refs"
        payload = {
            "ref": f"refs/heads/{new_branch_name}",
            "sha": sha
        }
        resp2 = requests.post(create_url, json=payload, headers=get_headers())
        if resp2.status_code == 201:
            return {"success": True, "branch": new_branch_name}
        elif resp2.status_code == 422:
             return {"success": True, "branch": new_branch_name, "note": "Branch already exists"}
        return {"error": f"Branch creation failed: {resp2.text}"}
    except Exception as e:
        return {"error": str(e)}

def update_file(repo_full_name, file_path, new_content, commit_message, branch_name):
    """
    Updates (or creates) a file in the repo.
    """
    api_url = f"{GITHUB_API_BASE}/repos/{repo_full_name}/contents/{file_path}"
    headers = get_headers()
    
    try:
        # 1. Get current file SHA (if it exists) to update it
        sha = None
        get_resp = requests.get(api_url + f"?ref={branch_name}", headers=headers)
        if get_resp.status_code == 200:
            sha = get_resp.json()["sha"]
            
        # 2. Prepare payload
        import base64
        content_b64 = base64.b64encode(new_content.encode('utf-8')).decode('utf-8')
        
        payload = {
            "message": commit_message,
            "content": content_b64,
            "branch": branch_name
        }
        if sha:
            payload["sha"] = sha
            
        # 3. PUT request
        put_resp = requests.put(api_url, json=payload, headers=headers)
        if put_resp.status_code in [200, 201]:
            return {"success": True}
        return {"error": f"File update failed: {put_resp.text}"}
    except Exception as e:
        return {"error": str(e)}


def create_pull_request(repo_full_name, title, body, head_branch, base_branch="main"):
    """
    Opens a PR from head_branch to base_branch.
    Note: If head_branch is on a fork, format is 'username:branch'.
    """
    # Sanitize inputs
    repo_full_name = repo_full_name.strip().rstrip("/")
    
    api_url = f"{GITHUB_API_BASE}/repos/{repo_full_name}/pulls"
    payload = {
        "title": title,
        "body": body,
        "head": head_branch,
        "base": base_branch
    }
    
    print(f"DTOO Creating PR at: {api_url}")
    print(f"Payload: {payload}")
    
    try:
        resp = requests.post(api_url, json=payload, headers=get_headers())
        if resp.status_code == 201:
            return resp.json() # Returns PR object
        
        print(f"PR Failed: {resp.status_code} - {resp.text}")
        return {"error": f"PR creation failed {resp.status_code}: {resp.text}"}
    except Exception as e:
        return {"error": str(e)}
        return {"error": str(e)}
