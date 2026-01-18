import os
import subprocess
import tempfile
import time
import logging
from django.core.cache import cache
from authentication.models import Project, VivaSession, ProgressUpdate

# Configure logging
logger = logging.getLogger(__name__)

# Simple in-memory cache: { "url": (timestamp, content) }
REPO_CACHE = {}
CACHE_DURATION = 600  # 10 minutes

def clone_and_read_repo(repo_url: str) -> str:
    """
    Clones a GitHub repository to a temporary directory and reads the content of text files.
    Returns a single string containing the file paths and their contents.
    Caches the result for 10 minutes to improve performance.
    """
    if not repo_url:
        return ""

    current_time = time.time()
    
    # Check cache
    if repo_url in REPO_CACHE:
        timestamp, content = REPO_CACHE[repo_url]
        if current_time - timestamp < CACHE_DURATION:
            logger.info(f"Serving {repo_url} from cache...")
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
            logger.info(f"Cloning {repo_url} to {temp_dir}...")
            
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
                        '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3',
                        '.sqlite3', '.db', '.sqlite'
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
                        logger.warning(f"Skipping file {rel_path}: {e}")
            
            # -----------------------------------------------
            # NEW: Capture "Audit Log" (Git History) - PREPENDED
            # -----------------------------------------------
            git_log_str = ""
            try:
                # Get the last 15 commits with Author and Relative Date
                git_log = subprocess.check_output(
                    ["git", "log", "--pretty=format:%h - %an (%ar): %s", "-n", "15"], 
                    cwd=temp_dir
                ).decode('utf-8')
                git_log_str = f"--- GIT AUDIT LOG (Last 15 Commits) ---\n{git_log}\n\n"
            except Exception as e:
                logger.warning(f"Could not fetch git log: {e}")
                git_log_str = f"--- GIT AUDIT LOG (Unavailable) ---\n(Error: {e})\n\n"

            # Combine: Git Log FIRST, then File Content
            final_content = git_log_str + "\n".join(repo_content)
            
            logger.warning(f"RAW REPO CONTENT SIZE: {len(final_content)} chars")
            
            # Strict Limit for Free Tier (Groq 6k TPM)
            # 12,000 chars is roughly 3,000 tokens. Plenty of room for history/prompt.
            limit = 12000
            if len(final_content) > limit:
                 final_content = final_content[:limit] + f"\n... (Truncated to {limit} chars for AI limits)"
            
            logger.warning(f"FINAL CONTEXT SIZE: {len(final_content)} chars")
            
            # Save to cache
            REPO_CACHE[repo_url] = (current_time, final_content)
                  
            return final_content
            
    except subprocess.CalledProcessError as e:
        logger.error(f"Error cloning repository: {e}")
        return f"Error cloning repository: {e}"
    except Exception as e:
        logger.error(f"Error processing repository: {str(e)}")
        return f"Error processing repository: {str(e)}"

def _build_project_context(project: Project, user_prompt: str = "") -> str:
    """
    Comprehensive Context Builder.
    Includes:
    1. Project Basics & Student Info
    2. Initial AI Scores
    3. Progress Update History (with Sentiment)
    4. Viva Examination History
    5. Artifacts (Screenshots/Code) - Full text
    6. Documentation (PDF) - AI Feedback + Truncated Text
    """
    # 1. Basic Info
    context = f"PROJECT REPORT (ID: {project.id})\n"
    context += f"Title: {project.title}\n"
    context += f"Status: {project.status}\n"
    context += f"Progress: {project.progress_percentage}%\n"
    context += f"Category: {project.category}\n"
    if project.github_repo_link:
        context += f"GitHub Repo: {project.github_repo_link}\n"
    
    # Include Audit Scores if available
    try:
        if project.audit_security_score:
             context += f"Security Score: {project.audit_security_score}/100\n"
        if project.audit_quality_score:
             context += f"Quality Score: {project.audit_quality_score}/100\n"
    except:
        pass

    # Include Audit Report Summary (Key Findings) if available
    if project.audit_report:
        try:
            # Assuming audit_report is a dict with 'summary' or similar
            if isinstance(project.audit_report, dict):
                summary = project.audit_report.get('summary', '') or project.audit_report.get('executive_summary', '')
                if summary:
                    context += f"Latest Audit Summary: {summary}\n"
            else:
                 context += f"Latest Audit Summary: {str(project.audit_report)[:500]}...\n"
        except:
            pass

    # 2. Student & Team Info
    # Handle potential missing submission link inverse
    student = None
    if hasattr(project, 'submission') and project.submission:
         student = project.submission.student
    else:
         # Fallback: try to find via related name or assume generic
         student_str = "Unknown"

    if student:
        context += f"\nSTUDENT/TEAM DETAILS\n"
        context += f"Lead Student: {student.first_name} {student.last_name} (Username: {student.username})\n"
        context += f"Email: {student.email}\n"
    
    # Check for Group/Team
    if hasattr(project, 'team') and project.team:
        context += f"Team Members:\n"
        for member in project.team.members.all():
            context += f"- {member.first_name} {member.last_name} ({member.username})\n"
    elif hasattr(project, 'submission') and project.submission and project.submission.group:
        context += f"Group: {project.submission.group.name}\n"
        context += f"Group Members (Potential):\n"
        for member in project.submission.group.students.all():
            context += f"- {member.first_name} {member.last_name} ({member.username})\n"
    
    
    # 3. Initial AI Evaluation
    if hasattr(project, 'submission') and project.submission:
        sub = project.submission
        context += f"\nINITIAL PROPOSAL EVALUATION\n"
        context += f"Relevance Score: {sub.relevance_score}/10\n"
        context += f"Feasibility Score: {sub.feasibility_score}/10\n"
        context += f"Innovation Score: {sub.innovation_score}/10\n"
        context += f"Abstract: {sub.abstract_text}\n"

    # 4. PROGRESS UPDATE HISTORY
    # Limit to last 5 updates to save tokens
    progress_logs = ProgressUpdate.objects.filter(project=project).order_by('-created_at')[:5]
    # Re-reverse to show in chronological order
    progress_logs = reversed(list(progress_logs))
    
    context += f"\nPROGRESS UPDATE HISTORY (Last 5 items)\n"
    
    # We iterate over the list now, not the queryset directly
    has_logs = False
    for i, log in enumerate(progress_logs, 1):
        has_logs = True
        context += f"\n-- Log {i} ({log.created_at.strftime('%Y-%m-%d')}) --\n"
        author_name = "Unknown"
        if log.author:
            author_name = log.author.username
            if hasattr(log.author, 'first_name') and log.author.first_name:
                author_name = f"{log.author.first_name} {log.author.last_name}"
        
        context += f"Author: {author_name}\n"
        # Truncate very long log text
        log_text = log.update_text if len(log.update_text) < 500 else log.update_text[:500] + "..."
        context += f"Report: {log_text}\n"
        sentiment = getattr(log, 'sentiment', 'N/A')
        context += f"Sentiment: {sentiment}\n"
        context += f"AI-Suggested Progress: {log.ai_suggested_percentage}%\n"

    if not has_logs:
        context += "No progress logs have been submitted yet.\n"

    # 5. VIVA HISTORY
    # Limit to last 3 sessions
    viva_sessions = VivaSession.objects.filter(project=project).order_by('-created_at')[:3]
    viva_sessions = reversed(list(viva_sessions))
    
    context += f"\nVIVA EXAMINATION HISTORY (Last 3 sessions)\n"
    
    has_viva = False
    for i, session in enumerate(viva_sessions, 1):
        has_viva = True
        s_name = "Unknown"
        if session.student:
            s_name = session.student.username
            if hasattr(session.student, 'first_name') and session.student.first_name:
                    s_name = f"{session.student.first_name} {session.student.last_name}"
        
        context += f"\n-- Session {i} ({session.created_at.strftime('%Y-%m-%d')}) - Student: {s_name} --\n"
        for q in session.questions.all()[:3]: # Limit questions per session too
            context += f"Q: {q.question_text}\n"
            a_text = q.student_answer if q.student_answer else 'Not answered'
            if len(a_text) > 200: a_text = a_text[:200] + "..." # Truncate answers
            context += f"A: {a_text}\n"
            context += f"Score: {q.ai_score}/10\n"

    if not has_viva:
        context += "No viva sessions have been attempted yet.\n"
        
    return context
