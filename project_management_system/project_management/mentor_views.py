from .utils import _build_project_context
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
import requests
from authentication.models import Project, VivaSession, AssignmentSubmission, ProgressUpdate
from gamification.models import StudentXP



class ProjectMentorChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user_message = request.data.get('message')

        if not user_message:
            return Response({"error": "Message is required"}, status=400)

        # 1. Fetch Project Context
        project = None
        try:
            # 1. Prioritize Projects where user is a Team Member
            project = Project.objects.filter(team__members=user).last()
            
            # 2. Fallback: Projects where user is in the Group
            if not project:
                project = Project.objects.filter(submission__group__students=user).last()

            # 3. Fallback: Direct approved submission
            if not project:
                submission = user.submissions.filter(status='Approved').last()
                if submission and hasattr(submission, 'project'):
                    project = submission.project
            
            # 4. Final Fallback: Any submission
            if not project:
                 submission = user.submissions.last()
                 if submission and hasattr(submission, 'project'):
                     project = submission.project

            if not project:
                return Response({"response": "I couldn't find an active project linked to your account. Please create or join a project first."}, status=200)

        except Exception as e:
            return Response({"error": f"Error fetching project: {str(e)}"}, status=500)

        # 2. Call AI Microservice (MCP Endpoint)
        try:
            payload = {
                "student_username": user.username,
                "user_message": user_message
            }
            # Note: Port 8001 is the AI Microservice
            response = requests.post("http://127.0.0.1:8001/mcp-chat", json=payload, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                # Ensure we return "response" key as expected by frontend
                if "response" in data:
                    return Response(data)
                else: 
                     # If microservice returns something else, wrap it
                     return Response({"response": str(data)})
            else:
                return Response({"error": f"AI Error: {response.text}"}, status=response.status_code)

        except Exception as e:
            return Response({"error": f"AI Microservice connection failed: {str(e)}"}, status=500)

from .mcp_server import mcp

class MCPToolView(APIView):
    """
    Exposes Django MCP tools over HTTP.
    Result: JSON response from the tool.
    """
    # permission_classes = [IsAuthenticated] # Optional: Secure this if microservice has token
    
    def post(self, request):
        tool_name = request.data.get("tool")
        arguments = request.data.get("arguments", {})
        
        if not tool_name:
            return Response({"error": "Tool name required"}, status=400)
            
        try:
            # FastMCP doesn't have a direct 'call_tool' in all versions, 
            # so we access the internal tool registry.
            # Assuming FastMCP pattern: mcp._tools[name] -> callable
            
            # Simple lookup based on how FastMCP stores decorators
            # NEW: Use explicit TOOLS registry
            from .mcp_server import TOOLS
            
            tool_func = TOOLS.get(tool_name)
            
            if not tool_func:
                 return Response({"error": f"Tool '{tool_name}' not found"}, status=404)
                 
            # Execute
            result = tool_func(**arguments)
            return Response({"result": result})
            
        except Exception as e:
            return Response({"error": f"Tool execution failed: {str(e)}"}, status=500)

class ProjectMentorChatMCPView(APIView):
    """
    Parallel Test View for the new MCP-based Chat.
    Frontend can switch to this endpoint to test the new system.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        user_message = request.data.get('message') or request.data.get('user_message')
        
        if not user_message:
            return Response({"error": "Message is required"}, status=400)
            
        # Call the AI Microservice's NEW MCP endpoint
        try:
             # Assume Microservice is running on port 8001 (or user provided env)
             # In production this should be in settings
             MICROSERVICE_URL = "http://127.0.0.1:8001/mcp-chat"
             
             payload = {
                 "user_message": user_message,
                 "student_username": user.username,
                 # "github_repo_link": ... (optional, can be added later)
             }
             
             # We assume requests is imported
             response = requests.post(MICROSERVICE_URL, json=payload, timeout=30)
             
             if response.status_code == 200:
                 return Response(response.json())
             else:
                 return Response({"error": f"AI Error: {response.text}"}, status=response.status_code)
                 
        except Exception as e:
            return Response({"error": f"Failed to connect to AI: {str(e)}"}, status=500)

class AIVivaMCPView(APIView):
    """
    MCP-Optimized Viva Question Generator.
    Delegates to AI Microservice which fetches context dynamically.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        # We don't need to send context anymore!
        # Just the username.
        
        try:
             MICROSERVICE_URL = "http://127.0.0.1:8001/mcp-viva-questions"
             payload = {
                 "student_username": user.username
             }
             
             response = requests.post(MICROSERVICE_URL, json=payload, timeout=30)
             
             if response.status_code == 200:
                 return Response(response.json())
             else:
                 return Response({"error": f"AI Error: {response.text}"}, status=response.status_code)
                 
        except Exception as e:
            return Response({"error": f"Failed to connect to AI: {str(e)}"}, status=500)

class TeacherChatMCPView(APIView):
    """
    Use this endpoint for the Teacher Assistant (MCP).
    It calls the specialized /mcp-teacher-chat endpoint.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        project_id = request.data.get('project_id')
        message = request.data.get('message')
        
        if not project_id:
             return Response({"error": "Project ID required."}, status=400)
             
        try:
             project = Project.objects.get(id=project_id)
             # Handle optional submission
             if not project.submission:
                  return Response({"error": "Project has no submission linked."}, status=400)
                  
             student_username = project.submission.student.username
             
             MICROSERVICE_URL = "http://127.0.0.1:8001/mcp-teacher-chat"
             payload = {
                 "student_username": student_username,
                 "user_message": message
             }
             
             response = requests.post(MICROSERVICE_URL, json=payload, timeout=60)
             
             if response.status_code == 200:
                  return Response(response.json())
             else:
                  return Response({"error": f"AI Error: {response.text}"}, status=response.status_code)

        except Project.DoesNotExist:
             return Response({"error": "Project not found."}, status=404)
        except Exception as e:
            return Response({"error": f"Failed to connect to AI: {str(e)}"}, status=500)
