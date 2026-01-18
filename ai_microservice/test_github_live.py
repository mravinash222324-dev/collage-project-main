
import github_api
import json

def test_live_api():
    print("Testing Live GitHub API...")
    
    # 1. Test Structure Fetch (Public Repo)
    # octocat/Hello-World is the standard test repo
    repo = "https://github.com/octocat/Hello-World"
    
    print(f"1. Fetching structure for {repo}...")
    structure = github_api.get_repo_structure(repo)
    
    if "error" in structure:
        print(f"❌ Error fetching structure: {structure['error']}")
    else:
        print("✅ Structure fetch successful!")
        tree = structure.get("tree", [])
        print(f"   Found {len(tree)} files.")
        for item in tree:
            print(f"   - {item['path']}")
            
        # 2. Test File Read
        if tree:
            file_to_read = tree[0]['path'] # usually README
            print(f"\n2. Reading file: {file_to_read}...")
            content = github_api.get_file_content(repo, file_to_read)
            
            if "content" in content:
                print("✅ File read successful!")
                print(f"   Content Preview: {content['content'][:50]}...")
            else:
                print(f"❌ Error reading file: {content}")

    # 3. Test Search
    print("\n3. Testing Code Search...")
    search_res = github_api.search_repo(repo, "Hello")
    if "error" in search_res:
         print(f"⚠️ Search skipped/error (likely rate limit): {search_res['error']}")
    else:
         print(f"✅ Search successful! Found {search_res.get('total_count', 0)} matches.")

if __name__ == "__main__":
    test_live_api()
