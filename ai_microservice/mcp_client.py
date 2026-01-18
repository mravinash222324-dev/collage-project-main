import requests
import json
import logging

logger = logging.getLogger(__name__)

# URL of the Django MCP Endpoint (assume localhost for now)
DJANGO_MCP_URL = "http://127.0.0.1:8000/api/mcp/"

class DjangoMCPClient:
    """
    Client to interact with the Django MCP Server.
    Allows the AI Agent to 'call' tools that live in the Django backend.
    """
    
    def __init__(self, base_url=DJANGO_MCP_URL):
        self.base_url = base_url

    def call_tool(self, tool_name: str, arguments: dict):
        """
        Executes a tool on the Django server.
        """
        try:
            payload = {
                "tool": tool_name,
                "arguments": arguments
            }
            response = requests.post(self.base_url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "result" in data:
                    return data["result"]
                elif "error" in data:
                    return f"Tool Error: {data['error']}"
                else:
                    return f"Unexpected Response: {data}"
            else:
                return f"HTTP Error {response.status_code}: {response.text}"
                
        except Exception as e:
            logger.error(f"MCP Client Error: {e}")
            return f"Connection Failed: {str(e)}"

    # --- Convenience Wrappers ---
    
    def get_project_context(self, student_username: str):
        return self.call_tool("get_student_project_context", {"student_username": student_username})

    def get_recent_logs(self, student_username: str, limit: int = 5):
        return self.call_tool("get_recent_progress_logs", {"student_username": student_username, "limit": limit})
        
    def get_viva_stats(self, student_username: str):
         return self.call_tool("get_viva_performance", {"student_username": student_username})

    def get_tasks(self, student_username: str):
        return self.call_tool("get_pending_tasks", {"student_username": student_username})

    def get_assignments(self, student_username: str):
        return self.call_tool("get_student_assignments", {"student_username": student_username})

    def get_viva_performance(self, student_username: str) -> dict:
        """Fetches viva history and average score."""
        return self.call_tool("get_viva_performance", {"student_username": student_username})

    def get_project_audit(self, student_username: str) -> dict:
        """Fetches GitHub Audit Report."""
        return self.call_tool("get_project_audit", {"student_username": student_username})

    def get_project_artifacts(self, student_username: str) -> list:
        """Fetches artifacts."""
        return self.call_tool("get_project_artifacts", {"student_username": student_username})

    def get_group_details(self, student_username: str) -> list:
        """Fetches group info."""
        return self.call_tool("get_group_details", {"student_username": student_username})

    def get_all_abstracts(self):
        return self.call_tool("get_all_project_abstracts", {})
