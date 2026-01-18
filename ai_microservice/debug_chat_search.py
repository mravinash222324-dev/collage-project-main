
from github_api import search_repo, get_repo_structure

repo_url = "https://github.com/Droomiweb/pet-mat/tree/main"
query = "login"

print(f"--- Debugging Repo: {repo_url} ---")

# 1. Test Structure (List Files)
print("\n[Step 1] Fetching File Tree...")
tree_res = get_repo_structure(repo_url)
if "tree" in tree_res:
    files = [i['path'] for i in tree_res['tree']]
    print(f"SUCCESS: Found {len(files)} files.")
    print("Sample files:", files[:5])
    
    # Simple local search simulation
    matches = [f for f in files if query in f.lower()]
    print(f"Local Filename Matches for '{query}': {matches}")
else:
    print(f"FAILURE: Could not fetch tree. Error: {tree_res}")

# 2. Test Search API
print("\n[Step 2] Testing GitHub Search API...")
res = search_repo(repo_url, query)
print(res)

if "items" in res:
    print(f"Search API Found {len(res['items'])} items.")
else:
    print("Search API Error or No keys.")
