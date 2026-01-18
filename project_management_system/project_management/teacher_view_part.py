
class TeacherChatMCPView(APIView):
    """
    Use this endpoint for the Teacher Assistant (MCP).
    It calls the specialized /mcp-teacher-chat endpoint.
    """
    permission_classes = [IsAuthenticated] # Teacher permission checked by frontend usually, but good to add IsTeacher if possible
    
    def post(self, request):
        # Expect 'project_id' and 'message'
        # But wait, MCP tool needs STUDENT username.
        # So we need to resolve project_id -> student_username
        
        project_id = request.data.get('project_id')
        message = request.data.get('message')
        
        if not project_id:
             return Response({"error": "Project ID required."}, status=400)
             
        try:
             project = Project.objects.get(id=project_id)
             student_username = project.submission.student.username
             
             MICROSERVICE_URL = "http://127.0.0.1:8001/mcp-teacher-chat"
             payload = {
                 "student_username": student_username,
                 "user_message": message
             }
             
             response = requests.post(MICROSERVICE_URL, json=payload, timeout=60) # Longer timeout for deep tools
             
             if response.status_code == 200:
                  return Response(response.json())
             else:
                  return Response({"error": f"AI Error: {response.text}"}, status=response.status_code)

        except Project.DoesNotExist:
             return Response({"error": "Project not found."}, status=404)
        except Exception as e:
            return Response({"error": f"Failed to connect to AI: {str(e)}"}, status=500)
