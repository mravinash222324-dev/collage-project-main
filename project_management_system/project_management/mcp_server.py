from mcp.server.fastmcp import FastMCP
from authentication.models import Project, User, ProgressUpdate, VivaSession, Task, TimedAssignment, AssignmentSubmission, ProjectSubmission, CodeReview, Group, Team, ProjectArtifact, VivaQuestion
from django.db.models import Avg
import json

# Initialize the MCP Server (scoped to Django)
mcp = FastMCP("Django PMS Data")

# Explicit Registry for Django Views
TOOLS = {}

def register_tool(func):
    """Decorator to register tool in both FastMCP and our local dict"""
    TOOLS[func.__name__] = func
    return mcp.tool()(func)

@register_tool
def get_student_project_context(student_username: str) -> str:
    """
    Fetches the active project details for a given student username.
    Returns JSON string with Title, Abstract, Tech Stack, and Status.
    """
    try:
        user = User.objects.filter(username=student_username).first()
        if not user:
            return "Error: Student not found."

        # 1. Prioritize Team Projects
        project = Project.objects.filter(team__members=user).last()
        
        # 2. Fallback: Group Projects
        if not project:
            project = Project.objects.filter(submission__group__students=user).last()
            
        if not project:
             # 3. Fallback: Approved Submissions
             submission = user.submissions.filter(status='Approved').last()
             if submission and hasattr(submission, 'project'):
                 project = submission.project

        if not project:
            return "No active project found for this student."

        context = {
            "title": project.title,
            "abstract": project.abstract, # Corrected field name
            "status": project.status,
            "progress": project.progress_percentage,
            "github_link": project.github_repo_link,
            "created_at": str(project.submission.submitted_at) if project.submission else "Unknown"
        }
        return json.dumps(context, indent=2)

    except Exception as e:
        return f"Error fetching project: {str(e)}"

@register_tool
def get_recent_progress_logs(student_username: str, limit: int = 5) -> str:
    """
    Fetches the 5 most recent progress checks/logs for the student.
    Useful for understanding what the student has been working on lately.
    """
    try:
        user = User.objects.filter(username=student_username).first()
        if not user: return "Error: Student not found."

        # Assuming ProgressUpdate is linked to Student or Project
        # Adjust logic based on actual model structure
        logs = ProgressUpdate.objects.filter(author=user).order_by('-created_at')[:limit]
        
        if not logs.exists():
            # Don't return string, return empty list if really empty
            # But wait, code reviews might exist!
            pass
            
        # 2. Fetch Recent Code Reviews (Evidence)
        code_reviews = CodeReview.objects.filter(student=user).order_by('-uploaded_at')[:3]
            
        log_list = []
        for log in logs:
            log_list.append({
                "type": "progress_update",
                "date": str(log.created_at.date()),
                "week_number": "N/A", 
                "task_completed": log.update_text[:200], # Summarize
                "issues_faced": "N/A"
            })
            
            # Check for attached code file
            if log.code_file:
                try:
                    # Open file in binary mode first to be safe
                    log.code_file.open('rb')
                    content_bytes = log.code_file.read()
                    
                    # Try decoding as UTF-8 (covers py, js, html, css, etc.)
                    try:
                        content = content_bytes.decode('utf-8')
                    except UnicodeDecodeError:
                        # Fallback for other encodings or just ignore if truly binary
                        content = content_bytes.decode('latin-1', errors='ignore')

                    log_list.append({
                        "type": "progress_code_attachment",
                        "date": str(log.created_at.date()),
                        "file_name": log.code_file.name,
                        # Check extension to ensure we are sending code
                        "code_snippet": content[:600] + "..." if len(content) > 600 else content,
                        "context": "Attached to Progress Update"
                    })
                except Exception as e:
                    # Fail silently for file read errors (maybe binary)
                    pass
                    
                    log_list.append({
                        "type": "progress_code_attachment",
                        "date": str(log.created_at.date()),
                        "file_name": log.code_file.name,
                        "code_snippet": content[:600] + "..." if len(content) > 600 else content,
                        "context": "Attached to Progress Update"
                    })
                except Exception as e:
                    # Fail silently for file read errors (maybe binary)
                    pass
            
        for cr in code_reviews:
            # Truncate code to avoid token overflow
            code_snippet = cr.code_content[:600] + "..." if len(cr.code_content) > 600 else cr.code_content
            log_list.append({
                "type": "code_submission",
                "date": str(cr.uploaded_at.date()),
                "file_name": cr.file_name,
                "code_snippet": code_snippet,
                "ai_quality_score": cr.quality_score
            })
            
        return json.dumps(log_list, indent=2)

    except Exception as e:
        return f"Error fetching logs: {str(e)}"

@register_tool
def get_viva_performance(student_username: str) -> str:
    """
    Returns the student's Viva history including detailed questions and answers.
    """
    try:
        user = User.objects.filter(username=student_username).first()
        if not user: return "Error: Student not found."

        vivas = VivaSession.objects.filter(student=user).order_by('-created_at')[:5]
        
        if not vivas.exists():
            return "No Viva sessions recorded."
            
        history = []
        total_overall_score = 0
        sessions_with_scores = 0
        
        for v in vivas:
            # Fetch all questions for this session
            qs = VivaQuestion.objects.filter(session=v).order_by('id')
            
            detailed_questions = []
            session_total_score = 0
            questions_with_scores = 0
            
            for q in qs:
                detailed_questions.append({
                    "question": q.question_text,
                    "answer": q.student_answer if q.student_answer else "No answer provided.",
                    "score": q.ai_score if q.ai_score is not None else 0,
                    "feedback": q.ai_feedback if q.ai_feedback else "No feedback yet."
                })
                if q.ai_score is not None:
                    session_total_score += q.ai_score
                    questions_with_scores += 1
            
            avg_session_score = (session_total_score / questions_with_scores) if questions_with_scores > 0 else 0
                
            history.append({
                "date": str(v.created_at.date()),
                "average_score": round(avg_session_score, 2),
                "questions": detailed_questions
            })
            
            if questions_with_scores > 0:
                total_overall_score += avg_session_score
                sessions_with_scores += 1
                
        avg_total = (total_overall_score / sessions_with_scores) if sessions_with_scores > 0 else 0
            
        return json.dumps({
            "average_historical_score": round(avg_total, 2),
            "recent_sessions": history
        }, indent=2)

    except Exception as e:
        return f"Error fetching viva stats: {str(e)}"

    except Exception as e:
        return f"Error fetching viva stats: {str(e)}"

@register_tool
def get_pending_tasks(student_username: str) -> str:
    """
    Fetches pending tasks from the project's Kanban board.
    """
    try:
        user = User.objects.filter(username=student_username).first()
        if not user: return "Error: Student not found."
        
        # Determine active project
        project = Project.objects.filter(team__members=user).last()
        if not project:
             project = Project.objects.filter(submission__group__students=user).last()
             
        if not project:
            return "No active project found to list tasks."
            
        tasks = Task.objects.filter(project=project).exclude(status='Done').order_by('created_at')
        
        if not tasks.exists():
            return "No pending tasks."
            
        task_list = []
        for t in tasks:
            task_list.append({
                "title": t.title,
                "status": t.status,
                "priority": "Normal" # Model doesn't have priority yet, default to Normal
            })
            
        return json.dumps(task_list, indent=2)
        
    except Exception as e:
        return f"Error fetching tasks: {str(e)}"

@register_tool
def get_student_assignments(student_username: str) -> str:
    """
    Fetches active timed assignments for the student's group.
    """
    try:
        user = User.objects.filter(username=student_username).first()
        if not user: return "Error: Student not found."
        
        # Find student's group
        # Helper: Try to find group from submission or direct relation?
        # Model User has 'student_groups' (ManyToMany to Group)
        groups = user.student_groups.all()
        
        if not groups.exists():
             return "Student is not in any group."
             
        # Find assignments for these groups
        import datetime
        from django.utils import timezone
        now = timezone.now()
        
        assignments = TimedAssignment.objects.filter(assigned_groups__in=groups, end_time__gt=now)
        
        if not assignments.exists():
            return "No active assignments."
            
        assignment_list = []
        for a in assignments:
            # Check if submitted?
            is_submitted = AssignmentSubmission.objects.filter(assignment=a, submitted_by=user).exists()
            assignment_list.append({
                "title": a.title,
                "type": a.assignment_type,
                "ends_at": str(a.end_time),
                "is_submitted": is_submitted
            })
            
        return json.dumps(assignment_list, indent=2)
        
    except Exception as e:
        return f"Error fetching assignments: {str(e)}"

@register_tool
def get_all_project_abstracts() -> str:
    """
    Fetches all project abstracts for plagiarism checking.
    Returns a lightweight JSON list of {id, title, abstract}.
    """
    try:
        # We only care about abstracts that are complex enough to check
        # and from valid submissions (not rejected ones maybe? or all for broader check)
        # Let's check ALL submissions to catch re-submissions.
        
        # Optimize: Only fetch needed fields
        submissions = ProjectSubmission.objects.values('id', 'title', 'abstract_text', 'student__username')
        
        data_list = []
        for sub in submissions:
            if sub['abstract_text'] and len(sub['abstract_text']) > 20: # Skip empty/short ones
                data_list.append({
                    "id": sub['id'],
                    "title": sub['title'],
                    "abstract": sub['abstract_text'],
                    "student": sub['student__username']
                })
                
        return json.dumps(data_list)
        
    except Exception as e:
        return f"Error fetching abstracts: {str(e)}"

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
            # Fallback: Check submission directly
            submission = user.submissions.filter(status='Approved').last()
            if submission and hasattr(submission, 'project'):
                 project = submission.project

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
    Fetches details about the student's group, including real names and roles.
    """
    try:
        user = User.objects.filter(username=student_username).first()
        if not user: return "Error: Student not found."
        
        # 1. Identify Group
        # Use first() instead of all() for simplicity in diagnostic
        group = user.student_groups.first()
        
        # Fallback: Check project's group if student_groups relation is not set
        if not group:
             project = Project.objects.filter(submission__student=user).last()
             if project and project.submission.group:
                 group = project.submission.group
                  
        if not group:
             return "Student is not currently assigned to a group."
             
        # 2. Extract Detailed Member Info
        members = []
        for s in group.students.all():
            is_leader = (s == group.students.all().first()) # Heuristic: First student is leader
            members.append({
                "username": s.username,
                "full_name": f"{s.first_name} {s.last_name}".strip() or s.username,
                "role": "Leader" if is_leader else "Member",
                "email": s.email
            })
            
        teachers = []
        for t in group.teachers.all():
            teachers.append({
                "username": t.username,
                "full_name": f"{t.first_name} {t.last_name}".strip() or t.username
            })
            
        group_info = {
            "group_name": group.name,
            "description": group.description,
            "total_members": len(members),
            "members": members,
            "supervising_teachers": teachers
        }
            
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
