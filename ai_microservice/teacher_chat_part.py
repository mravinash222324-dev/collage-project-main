
class MCPTeacherChatIn(BaseModel):
    student_username: str
    message: str

@app.post("/mcp-teacher-chat")
def mcp_teacher_chat(data: MCPTeacherChatIn):
    try:
        client = DjangoMCPClient()
        
        # 1. Fetch Context (Tools)
        # We fetch EVERYTHING for the teacher because they need a deep dive.
        # Cost is managed because we are only doing this when the Teacher explicitly asks.
        
        # A. Basic Project Info
        project_context_json = client.get_project_context(data.student_username)
        project_data = json.loads(project_context_json) if isinstance(project_context_json, str) else project_context_json
        
        if "title" not in project_data:
             return {"response": f"Could not find active project for student: {project_context_json}"}
             
        title = project_data.get("title", "Unknown")
        abstract = project_data.get("abstract", "Unknown")
        progress = project_data.get("progress", 0)
        
        # B. Deep Data
        viva_stats = client.get_viva_performance(data.student_username)
        audit_report = client.get_project_audit(data.student_username)
        group_info = client.get_group_details(data.student_username)
        artifacts = client.get_project_artifacts(data.student_username)
        
        # 3. Construct Teacher Prompt
        prompt = f"""
        You are an AI Assistant for a University Professor overseeing a Student Project.
        
        Student: {data.student_username}
        Project: "{title}"
        Progress: {progress}%
        
        --- DEEP CONTEXT ---
        
        [GROUP DETAILS]
        {json.dumps(group_info, indent=2) if group_info else "No Group Info"}
        
        [VIVA PERFORMANCE]
        {json.dumps(viva_stats, indent=2) if viva_stats else "No Viva Data"}
        
        [GITHUB AUDIT & QUALITY]
        {json.dumps(audit_report, indent=2) if audit_report else "No Audit Data"}
        
        [UPLOADED ARTIFACTS]
        {json.dumps(artifacts, indent=2) if artifacts else "No Artifacts"}
        
        --- TEACHER QUESTION ---
        "{data.message}"
        
        --- INSTRUCTIONS ---
        1. Answer the teacher's question accurately using the data provided above.
        2. If asking about grades/performance, cite the Viva scores and Audit scores.
        3. If asking about the team, mention the group members.
        4. Be professional, concise, and helpful.
        5. If data is missing (e.g., "No Viva Data"), explicitly state that the student hasn't taken a viva yet.
        """
        
        response = generate_with_retry(gemini_model, prompt)
        return {"response": response}

    except Exception as e:
        return {"error": f"Teacher Chat failed: {str(e)}"}
