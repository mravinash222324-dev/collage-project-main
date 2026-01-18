
@register_tool
def get_project_audit(student_username: str) -> str:
    """
    Fetches the latest Audit Report (Security & Quality scores) for the student's project.
    """
    try:
        user = User.objects.filter(username=student_username).first()
        if not user: return "Error: Student not found."
        
        project = Project.objects.filter(team__members=user).last()
        if not project:
            project = Project.objects.filter(submission__group__students=user).last()
            
        if not project:
            return "No active project found."
            
        report = {
            "security_score": project.audit_security_score,
            "quality_score": project.audit_quality_score,
            "report_summary": project.audit_report.get('summary', 'No summary available') if project.audit_report else "No detailed report."
        }
        return json.dumps(report, indent=2)
    except Exception as e:
        return f"Error fetching audit: {str(e)}"

@register_tool
def get_group_details(student_username: str) -> str:
    """
    Fetches details about the student's group and its members.
    """
    try:
        user = User.objects.filter(username=student_username).first()
        if not user: return "Error: Student not found."
        
        # Check student groups
        groups = user.student_groups.all()
        if not groups.exists():
             return "Student is not in any group."
             
        group_info = []
        for g in groups:
            members = [s.username for s in g.students.all()]
            teachers = [t.username for t in g.teachers.all()]
            group_info.append({
                "group_name": g.name,
                "description": g.description,
                "members": members,
                "teachers": teachers
            })
            
        return json.dumps(group_info, indent=2)
    except Exception as e:
        return f"Error fetching group details: {str(e)}"

@register_tool
def get_project_artifacts(student_username: str) -> str:
    """
    Fetches list of uploaded artifacts (images, docs) with their AI-generated tags and extracted text.
    Useful for understanding diagrams or design docs the student uploaded.
    """
    try:
        user = User.objects.filter(username=student_username).first()
        project = Project.objects.filter(team__members=user).last()
        if not project: project = Project.objects.filter(submission__group__students=user).last()
        
        if not project: return "No project found."
        
        artifacts = ProjectArtifact.objects.filter(project=project).order_by('-uploaded_at')[:5]
        if not artifacts.exists():
            return "No artifacts uploaded."
            
        art_list = []
        for art in artifacts:
            art_list.append({
                "description": art.description,
                "ai_tags": art.ai_tags,
                "extracted_text_summary": art.extracted_text[:200] + "..." if art.extracted_text else "No text extracted."
            })
            
        return json.dumps(art_list, indent=2)
    except Exception as e:
        return f"Error fetching artifacts: {str(e)}"
