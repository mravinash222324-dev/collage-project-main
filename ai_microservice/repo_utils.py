import os
import subprocess
import tempfile
import shutil

import time

# Simple in-memory cache: { "url": (timestamp, content) }
REPO_CACHE = {}
CACHE_DURATION = 600  # 10 minutes

def clone_and_read_repo(repo_url: str) -> str:
    """
    Clones a GitHub repository to a temporary directory and reads the content of text files.
    Returns a single string containing the file paths and their contents.
    Caches the result for 10 minutes to improve performance.
    """
    current_time = time.time()
    
    # Check cache
    if repo_url in REPO_CACHE:
        timestamp, content = REPO_CACHE[repo_url]
        if current_time - timestamp < CACHE_DURATION:
            print(f"Serving {repo_url} from cache...")
            return content

    try:
        # Clean the URL to ensure it's the root repo URL
        # Remove /tree/..., /blob/..., etc.
        if "github.com" in repo_url:
            parts = repo_url.split('/')
            if len(parts) > 5:
                repo_url = "/".join(parts[:5])
        
        if not repo_url.endswith('.git'):
            repo_url += '.git'

        # Create a temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            print(f"Cloning {repo_url} to {temp_dir}...")
            
            # Clone the repo
            # We use --depth 1 to only get the latest commit and save bandwidth/time
            subprocess.check_call(["git", "clone", "--depth", "1", repo_url, temp_dir])
            
            repo_content = []
            
            # Walk through the directory
            for root, dirs, files in os.walk(temp_dir):
                # Skip .git directory
                if '.git' in dirs:
                    dirs.remove('.git')
                
                for file in files:
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, temp_dir)
                    
                    # Skip common non-code or large files
                    # Add more extensions as needed
                    skip_extensions = [
                        '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', 
                        '.pdf', '.zip', '.exe', '.pyc', '.dll', '.so', 
                        '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3'
                    ]
                    
                    if any(rel_path.lower().endswith(ext) for ext in skip_extensions):
                        continue
                    
                    # Skip hidden files/dirs (except .env maybe, but usually we shouldn't read .env)
                    if any(part.startswith('.') for part in rel_path.split(os.sep)):
                        continue
                        
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            # Limit file size to avoid overloading context (e.g., 50KB)
                            if len(content) > 50000:
                                content = content[:50000] + "\n... (truncated)"
                            
                            repo_content.append(f"--- File: {rel_path} ---\n{content}\n")
                    except Exception as e:
                        print(f"Skipping file {rel_path}: {e}")
            
            final_content = "\n".join(repo_content)
            
            # Limit total content size if needed (e.g., 2MB)
            if len(final_content) > 2000000:
                 final_content = final_content[:2000000] + "\n... (Total repository content truncated)"
            
            # Save to cache
            REPO_CACHE[repo_url] = (current_time, final_content)
                 
            return final_content
            
    except subprocess.CalledProcessError as e:
        return f"Error cloning repository: {e}"
    except Exception as e:
        return f"Error processing repository: {str(e)}"
