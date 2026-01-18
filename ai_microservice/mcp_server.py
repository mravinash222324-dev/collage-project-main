
from mcp.server.fastmcp import FastMCP
import github_api

# Initialize MCP Server
# "GitHub Audit" is the name of the server
mcp = FastMCP("GitHub Audit")

@mcp.tool()
def get_repo_structure(repo_url: str) -> str:
    """
    Get the file hierarchy of a GitHub repository.
    Returns a JSON string representing the file tree structure.
    Useful for understanding the project architecture before reading specific files.
    """
    result = github_api.get_repo_structure(repo_url)
    if "error" in result:
        return f"Error: {result['error']}"
    
    # Process the tree to be more readable for the LLM
    # We only want paths to save tokens
    tree = result.get("tree", [])
    paths = [item["path"] for item in tree]
    
    # Limit to top 200 files to avoid context explosion
    if len(paths) > 200:
        paths = paths[:200]
        paths.append("... (truncated)")
        
    return f"Repository Structure ({len(paths)} files found):\n" + "\n".join(paths)

@mcp.tool()
def read_file(repo_url: str, file_path: str) -> str:
    """
    Read the contents of a specific file from the repository.
    Use this to inspect code for security vulnerabilities, logic, or implementation details.
    """
    result = github_api.get_file_content(repo_url, file_path)
    if "error" in result:
        return f"Error reading file: {result['error']}"
    
    return f"--- File: {file_path} ---\n{result['content']}"

@mcp.tool()
def search_code(repo_url: str, query: str) -> str:
    """
    Search for specific keywords or patterns in the repository code.
    Use this to find relevant code snippets without traversing the whole file tree.
    Example queries: "password", "def auth", "TODO", "API_KEY"
    """
    result = github_api.search_repo(repo_url, query)
    if "error" in result:
        return f"Error searching: {result['error']}"
        
    items = result.get("items", [])
    if not items:
        return "No matches found."
        
    matches = []
    for item in items[:5]: # Return top 5 matches
        matches.append(f"Match: {item['path']}")
        
    return "\n".join(matches)

if __name__ == "__main__":
    # Standard MCP entry point
    mcp.run()
