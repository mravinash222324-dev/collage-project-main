# In ai_microservice/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
# from transformers import pipeline # Removed
import uvicorn
import uvicorn
from google import genai
from google import genai
from google.genai import types, errors
from google.api_core import exceptions # Keep for legacy if needed/safety
import json
import re
import os
from dotenv import load_dotenv
from repo_utils import clone_and_read_repo
from repo_utils import clone_and_read_repo
import requests
# from sentence_transformers import SentenceTransformer, util # Removed

# Load environment variables
load_dotenv()

print("Loading AI models into memory...")

# --- Load SBERT Model (API VERSION) ---
# We no longer load local models. We used requests to HF Inference API.
HF_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")
if not HF_TOKEN:
    print("CRITICAL CHECK: HUGGINGFACE_API_TOKEN is missing! AI features will fail.")

def query_hf_api(payload, model_id):
    api_url = f"https://router.huggingface.co/hf-inference/models/{model_id}"
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=20)
        if response.status_code != 200:
             print(f"HF API Status: {response.status_code}")
             print(f"HF API Response: {response.text}")
        return response.json()
    except Exception as e:
        print(f"HF API Error ({model_id}): {e}")
        try:
             print(f"Raw Response: {response.text}")
        except: pass
        return {"error": str(e)}

# --- Configure Gemini with Key Pool ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") # Backward compatibility

class GeminiManager:
    def __init__(self):
        # Load pool from env
        pool_str = os.getenv("GEMINI_KEY_POOL", "[]")
        try:
            self.api_keys = json.loads(pool_str)
        except json.JSONDecodeError:
            print("WARNING: Failed to decode GEMINI_KEY_POOL. Using single key.")
            self.api_keys = []
            
        # Fallback to single key if pool is empty
        if not self.api_keys and GEMINI_API_KEY:
            self.api_keys = [GEMINI_API_KEY]
        
        if not self.api_keys:
            print("CRITICAL WARNING: No Gemini Keys found!")
            
        self.current_key_index = 0
        self.model = None
        self._configure_client()

    def _configure_client(self):
        if not self.api_keys: return
        
        # Configure with current key
        current_key = self.api_keys[self.current_key_index]
        try:

            # New SDK Client
            self.model = genai.Client(api_key=current_key)
            print(f"Switched to Gemini Key #{self.current_key_index + 1}")
        except Exception as e:
            print(f"Error configuring key #{self.current_key_index + 1}: {e}")
            self._rotate_key()

    def _rotate_key(self):
        if not self.api_keys: return
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        self._configure_client()

    def generate_content(self, prompt):
        """
        Generates content with key rotation on ResourceExhausted.
        """
        # We'll try to rotate through the ENTIRE pool multiple times if necessary
        max_attempts = len(self.api_keys) * 3 
        
        for attempt in range(max_attempts):
            try:
                # Ensure model is ready
                if not self.model: self._configure_client()
                
                # If we still don't have a model (no keys), raise
                if not self.model: raise Exception("No Gemini keys available.")

                return self.model.models.generate_content(
                    model='gemini-flash-latest',
                    contents=prompt
                )
                
            except errors.ClientError as e:
                if e.code == 429:
                    print(f"⚠️ Key #{self.current_key_index + 1} Exhausted (429). Rotating...")
                    self._rotate_key()
                    time.sleep(1)
                else:
                    print(f"❌ Gemini Client Error: {e}")
                    raise e
                
            except Exception as e:
                print(f"❌ Gemini Error on Key #{self.current_key_index + 1}: {e}")
                # For 500s or other transient errors, also rotate/retry
                self._rotate_key()
                time.sleep(1)
                
        raise Exception("All Gemini keys exhausted or failed.")

# Initialize Manager
gemini_manager = GeminiManager()
# Keep gemini_model variable for backward compatibility of other tools if they import it, 
# though we won't use it directly in our new logic.
gemini_model = gemini_manager.model 

import time
from google.api_core import exceptions

def generate_with_retry(model, prompt, retries=5, delay=10):
    """
    Refactored to use gemini_manager for rotation.
    'model' argument is ignored in favor of the manager's dynamic model.
    """
    return gemini_manager.generate_content(prompt)
 

# --- Lazy Loading Global Variables (Now using API) ---
# We don't need to load heavy models into memory!
# Functions below will just call the API directly.


# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)



# --- (NEW) Groq Key Manager ---
class GroqKeyManager:
    def __init__(self):
        self.api_keys = json.loads(os.getenv("GROQ_KEY_POOL", "[]"))
        if not self.api_keys:
             # Fallback strictly for local dev or warn
             print("WARNING: No Groq Keys found in env.")
             self.api_keys = []
        self.current_index = 0

    def get_current_key(self):
        return self.api_keys[self.current_index]

    def rotate_key(self):
        print(f"⚠️ Rotating Groq Key... (Current: #{self.current_index + 1})")
        self.current_index = (self.current_index + 1) % len(self.api_keys)
        print(f"✅ Switched to Groq Key #{self.current_index + 1}")

groq_manager = GroqKeyManager()

# --- (NEW) Groq TTS Streaming Endpoint ---


# Define the input data models
class TextIn(BaseModel):
    text: str

class CodeReviewIn(BaseModel):
    code: str
    filename: str
    context: str = ""  # Optional project context

class CheckpointGenerationIn(BaseModel):
    title: str
    description: str
    category: str

class CheckpointVerificationIn(BaseModel):
    checkpoint_title: str
    checkpoint_description: str
    proof_text: str
    project_context: str

class AssignmentVerificationIn(BaseModel):
    assignment_type: str
    description: str
    text_content: str
    project_context: str = ""
    image_data: str = None # Base64 encoded image string

class ProjectGraphIn(BaseModel):
    title: str
    abstract: str
    tasks: list[str] = []

class AuditCodeIn(BaseModel):
    github_repo_link: str
    project_context: str

class StudentRiskIn(BaseModel):
    student_name: str
    sentiment_history: list[str] # List of "Positive", "Negative", "Neutral"
    days_since_last_update: int
    avg_quality_score: float

class DeepReportIn(BaseModel):
    student_name: str
    project_title: str
    logs: list[str]
    code_reviews: list[dict]
    viva_history: list[dict]

class MockGradingIn(BaseModel):
    project_title: str
    project_description: str
    repo_link: str


# --- Define API Endpoints ---

@app.post("/parse-project-text")
def parse_project_text(data: TextIn):
    try:
        prompt = f"""
        Analyze the following text extracted from a student's project document.
        Identify the likely **Project Title**, **Project Abstract/Summary**, **Tech Stack**, and **Tools**.

        Text Content:
        "{data.text[:10000]}"  # Limit context if needed

        Task:
        1. Extract the Title. If unable to find, generate a suitable title based on content.
        2. Extract a DETAILED Abstract/Summary. Do not summarize too briefly. Capture the core problem, solution, and methodology in at least 2-3 paragraphs.
        3. Extract ALL listed Technologies, Frameworks, Libraries, and Tools. Be thorough.

        Return JSON:
        {{
            "title": "...",
            "abstract": "...",
            "tech_stack": ["React", "Django", ...],
            "tools": ["VS Code", "GitHub", ...]
        }}
        Output ONLY valid JSON.
        """
        
        response = generate_with_retry(gemini_model, prompt)
        text = response.text.strip()
        
        # Extract JSON
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL | re.IGNORECASE)
        json_str = match.group(1) if match else text
        
        try:
             # Basic cleanup if regex didn't catch specific json block
            match_backup = re.search(r"(\{.*\})", json_str, re.DOTALL)
            if match_backup:
                json_str = match_backup.group(1)

            result = json.loads(json_str)
            return result
        except json.JSONDecodeError:
             return {"error": "Failed to parse AI response", "raw_response": text}

    except Exception as e:
        return {"error": f"Parsing failed: {str(e)}"}




@app.post("/audit-code")
def audit_code(data: AuditCodeIn):
    try:
        from github_api import get_repo_structure, get_file_content, validate_repo
        
        # 0. Strict Validation Check
        validation = validate_repo(data.github_repo_link)
        if not validation["valid"]:
             return {
                 "security_score": 0,
                 "quality_score": 0,
                 "issues": [{"severity": "Critical", "title": "Invalid Repository", "description": validation["error"]}],
                 "recommendations": ["Please provide a valid GitHub repository URL that contains your project code."]
             }

        # 1. Fetch Repo Structure (Live, No Cloning)
        print(f"Fetching structure for {data.github_repo_link}...")
        structure = get_repo_structure(data.github_repo_link)
        
        if "error" in structure:
             return {"error": f"GitHub API Error: {structure['error']}"}

        # Simplified tree for AI (paths only)
        tree = structure.get("tree", [])
        paths = [item["path"] for item in tree]
        
        # Filter for relevant files (skip images, etc.) to show AI
        relevant_paths = [p for p in paths if p.endswith(('.py', '.js', '.ts', '.tsx', '.html', '.css', '.md', '.json'))]
        # Limit to top 50 relevant files for context
        file_list_str = "\n".join(relevant_paths[:50])
        
        # 2. First Pass: Ask AI which files to read
        # In a full MCP Agent, this would be a loop. Here we do a 1-step "Plan & Read".
        planning_prompt = f"""
        Act as a Security Audit Planner.
        
        Project Context: {data.project_context}
        
        File Structure:
        {file_list_str}
        
        Task:
        Select up to 5 files that are MOST critical to audit for security (auth, sensitive data) and quality.
        Do not select config files unless they contain secrets.
        
        Return JSON List of strings: ["path/to/file1", "path/to/file2"]
        """
        
        plan_response = generate_with_retry(gemini_model, planning_prompt)
        text = plan_response.text.strip()
        
        files_to_read = []
        try:
            match = re.search(r"(\[.*\])", text, re.DOTALL)
            if match:
                files_to_read = json.loads(match.group(1))
        except:
            files_to_read = [] # Fallback
            
        print(f"AI decided to inspect: {files_to_read}")
        
        if not files_to_read:
             return {
                 "security_score": 0,
                 "quality_score": 0,
                 "issues": [],
                 "recommendations": ["No relevant code files (.py, .js, .ts, etc.) were found or selected for audit."]
             }
        
        # 3. Read Selected Files (Live)
        code_context = ""
        for file_path in files_to_read:
            # Safety check: insure file path actually exists in paths list, albeit loosely to handle minor AI typos
            # But strictly it's better to check exact match or at least contained
            if any(p == file_path for p in paths):
                 res = get_file_content(data.github_repo_link, file_path)
                 if "content" in res:
                     code_context += f"\n--- {file_path} ---\n{res['content'][:15000]}\n" # Limit per file
                 else:
                     code_context += f"\n--- {file_path} (Error reading) ---\n"
            
        # 4. Final Audit (Using the specific file content)
        audit_prompt = f"""
        Act as a Senior Security Engineer. Perform a high-level audit on these specific files.
        
        Project Context: {data.project_context}
        
        Selected Code Content:
        {code_context[:60000]}
        
        Task:
        Provide a JSON report.
        1. Calculate Security Score (0-100).
        2. Calculate Quality Score (0-100).
        3. List major issues (Max 3). **Crucial**: For each issue, specify the 'file_path' where it is located.
        4. List recommendations (Max 3).

        Return JSON format:
        {{
            "security_score": <int>,
            "quality_score": <int>,
            "issues": [{{ "severity": "High/Medium", "title": "...", "description": "...", "file_path": "path/or/null" }}],
            "recommendations": ["..."]
        }}
        """
        
        response = generate_with_retry(gemini_model, audit_prompt)
        text = response.text.strip()
        
        # Extract JSON
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL | re.IGNORECASE)
        if match:
            json_str = match.group(1)
        else:
            match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
            json_str = match.group(1) if match else text
                
        try:
            result = json.loads(json_str)
            return result
        except json.JSONDecodeError:
            return {"error": "Failed to parse AI response as JSON", "raw_response": text}

    except Exception as e:
        return {"error": f"Audit failed: {str(e)}"}


# --- Auto-Fix / PR Agent ---
class AutoFixIn(BaseModel):
    github_repo_link: str
    issue_title: str
    issue_description: str
    file_path: str
    project_context: str = ""

@app.post("/auto-fix")
def auto_fix(data: AutoFixIn):
    try:
        from github_api import get_file_content, fork_repo, create_branch, update_file, create_pull_request, get_headers
        
        print(f"Auto-fixing {data.issue_title} in {data.file_path}")
        
        # 1. Fetch original file content
        res = get_file_content(data.github_repo_link, data.file_path)
        if "error" in res or "content" not in res:
            return {"error": f"Could not read file {data.file_path} to fix it."}
        
        original_code = res['content']
        
        # 2. Generate Fix using AI
        fix_prompt = f"""
        Act as a Senior Developer. Fix the following issue in the code.
        
        Issue: {data.issue_title}
        Description: {data.issue_description}
        File: {data.file_path}
        
        CODE CONTENT:
        ```
        {original_code}
        ```
        
        TASK:
        Rewrite the code to fix the issue. Return ONLY the full valid code.
        Do NOT wrap in markdown blocks if possible, or simple standard blocks.
        """
        
        response = generate_with_retry(gemini_model, fix_prompt)
        fixed_code = response.text
        
        # Clean markdown
        if fixed_code.strip().startswith("```"):
            lines = fixed_code.strip().split("\n")
            lines = lines[1:]
            if lines and lines[-1].strip() == "```": lines = lines[:-1]
            fixed_code = "\n".join(lines)
            
        if not fixed_code:
            return {"error": "AI failed to generate a fix."}

        # 3. Create PR Workflow
        # A. Fork the Student Repo (to our bot account)
        fork_res = fork_repo(data.github_repo_link)
        if "error" in fork_res: return {"error": fork_res['error']}
        
        bot_repo_full_name = fork_res['full_name'] # e.g. "ai-bot/student-project"

        student_repo_full_name = data.github_repo_link.replace("https://github.com/", "").replace(".git", "")
        if "/tree/" in student_repo_full_name:
            student_repo_full_name = student_repo_full_name.split("/tree/")[0]
        student_repo_full_name = student_repo_full_name.strip().rstrip("/")
        
        # B. Create a Branch on the Fork
        # We need to wait a sec for fork to be ready potentially, but usually API handles it or returns 202
        import time
        time.sleep(2) # Safety buffer for fork propagation
        
        import uuid
        branch_name = f"ai-fix-{uuid.uuid4().hex[:8]}"
        
        branch_res = create_branch(bot_repo_full_name, branch_name) # Bases off main/master automatically
        if "error" in branch_res: return {"error": branch_res['error']}
        
        # C. Commit the Fix to the Fork's Branch
        commit_res = update_file(
            bot_repo_full_name, 
            data.file_path, 
            fixed_code, 
            f"AI Fix: {data.issue_title}", 
            branch_name
        )
        if "error" in commit_res: return {"error": commit_res['error']}
        
        # D. Open Pull Request (From Fork:Branch -> Student:Main)
        # Head format for cross-repo PR: "fork_owner:branch"
        fork_owner = bot_repo_full_name.split("/")[0]
        head_ref = f"{fork_owner}:{branch_name}"
        
        pr_res = create_pull_request(
            student_repo_full_name,
            f"AI Fix: {data.issue_title}",
            f"This PR was automatically generated by AI to fix: {data.issue_description}",
            head_ref
        )
        
        if "error" in pr_res: return {"error": pr_res['error']}
        
        return {"success": True, "pr_url": pr_res.get("html_url")}

    except Exception as e:
        return {"error": str(e)}


    except Exception as e:
        return {"error": str(e)}


# --- Chat with Codebase (RAG) ---
class ChatCodebaseIn(BaseModel):
    github_repo_link: str
    query: str
    project_context: str = ""


@app.post("/chat-codebase")
def chat_codebase(data: ChatCodebaseIn):
    try:
        from github_api import search_repo, get_file_content, get_repo_structure
        
        print(f"Chatting with codebase: {data.query}")
        
        # 1. Smarter Keyword Extraction
        keyword_prompt = f"""
        Act as a Technical Search Expert.
        User Query: "{data.query}"
        
        Task: Provide a list of 1-3 highly specific search terms (keywords or code snippets) that would likely appear in the relevant files.
        Return ONLY a JSON list of strings.
        Example: "How is login handled?" -> ["login", "authenticate", "JWT"]
        """
        kw_response = generate_with_retry(gemini_model, keyword_prompt)
        try:
            match = re.search(r"(\[.*\])", kw_response.text, re.DOTALL)
            search_terms = json.loads(match.group(1)) if match else [kw_response.text.strip()]
        except:
            search_terms = [kw_response.text.strip().split()[0]]

        print(f"Search Terms: {search_terms}")
        
        items = []
        search_error = None
        
        # 2. Try GitHub Search API with multiple terms
        for term in search_terms[:2]:
            search_res = search_repo(data.github_repo_link, term)
            if "items" in search_res:
                items.extend(search_res["items"])
            elif "error" in search_res:
                search_error = search_res.get("message", "Search API failed")
            
            if len(items) >= 5: break

        # Deduplicate items by path
        seen_paths = set()
        unique_items = []
        for item in items:
            if item["path"] not in seen_paths:
                unique_items.append(item)
                seen_paths.add(item["path"])
        items = unique_items

        # 3. Enhanced Fallback: AI-Driven File Selection from Tree
        if not items:
            print(f"Search API returned no results or failed: {search_error}. Using AI Fallback...")
            struct = get_repo_structure(data.github_repo_link)
            
            if "error" in struct:
                return {"answer": f"I couldn't search your code properly. Reason: {struct.get('message', 'Unknown Error')}. Please check your repository link or branch."}
            
            if "tree" in struct:
                all_paths = [node["path"] for node in struct["tree"] if node["type"] == "blob"]
                
                # Filter for source code files to reduce context
                relevant_ext = ('.py', '.js', '.ts', '.tsx', '.go', '.java', '.c', '.cpp', '.rb', '.php', '.cs', '.html', '.css')
                source_paths = [p for p in all_paths if p.lower().endswith(relevant_ext)]
                
                # If too many files, truncate list for AI
                path_list_str = "\n".join(source_paths[:200])
                
                fallback_prompt = f"""
                Act as a Codebase Architect.
                The user is asking: "{data.query}"
                Below is the file tree of the project.
                
                FILE LIST:
                {path_list_str}
                
                Task: Select up to 5 files that are MOST likely to contain the answer. 
                Return ONLY a JSON list of file paths.
                """
                
                fb_response = generate_with_retry(gemini_model, fallback_prompt)
                try:
                    match = re.search(r"(\[.*\])", fb_response.text, re.DOTALL)
                    items = [{"path": p} for p in json.loads(match.group(1))] if match else []
                except:
                    items = []
                
        if not items:
             msg = "I active-searched for your query but found no matching code files."
             if search_error: msg += f" (Note: {search_error})"
             return {"answer": msg}
             
        # 4. Read Top Files (max 5)
        top_files = items[:5]
        code_context = ""
        files_read = []
        
        for item in top_files:
            path = item["path"]
            res = get_file_content(data.github_repo_link, path)
            if "content" in res:
                content = res['content']
                # Truncate large files per file
                if len(content) > 10000: content = content[:10000] + "\n...(File Truncated)..."
                code_context += f"\n--- FILE: {path} ---\n{content}\n"
                files_read.append(path)
                
        # 5. Generate Final Answer
        rag_prompt = f"""
        Act as a Senior Developer explaining the codebase.
        
        User Question: "{data.query}"
        
        [CONTEXT FROM CODE DISCOVERY]
        Files inspected: {", ".join(files_read)}
        
        [CODE CONTENT]
        {code_context[:50000]}
        
        Task:
        1. Answer the user's question clearly based on the provided code.
        2. If the code provided doesn't fully answer it, explain what you found and what might be missing.
        3. Reference specific file names and logic blocks.
        4. If you hit a technical limit (like rate limits mentioned in search errors), mention it to the user.
        """
        
        answer_response = generate_with_retry(gemini_model, rag_prompt)
        return {"answer": answer_response.text}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Chat system error: {str(e)}"}


# --- (NEW) MCP Agent Chat ---
from mcp_client import DjangoMCPClient

class MCPChatIn(BaseModel):
    user_message: str
    student_username: str # Required to fetch context
    github_repo_link: str = "" # Optional

@app.post("/mcp-chat")
def mcp_chat(data: MCPChatIn):
    """
    Experimental Agentic Chat Endpoint.
    Uses a multi-turn 'Think-Act-Observe' loop to gather data via MCP.
    """
    try:
        client = DjangoMCPClient()
        history = [] # To track tool results for the final answer
        
        # Max 3 agentic steps to avoid infinite loops/high costs
        max_steps = 3
        
        for step in range(max_steps):
            step_prompt = f"""
            You are an Agentic Project Mentor. You have access to a student's database via tools.
            User: {data.student_username}
            
            Current History of Data Gathered:
            {json.dumps(history, indent=2) if history else "No data gathered yet."}
            
            Available Tools (A to Z Context):
            1. `get_project_context`: Title, abstract, tech stack.
            2. `get_student_logs`: Recent progress logs and code snippets.
            3. `get_viva_stats`: Detailed Viva history (Q&A).
            4. `get_group_details`: Team members, Roles, and Teachers.
            5. `get_project_audit`: Security/Quality scores.
            6. `get_tasks`: Kanban board status.
            7. `get_assignments`: Pending timed assignments.
            8. `get_project_artifacts`: Extra documents/diagrams.
            
            User Message: "{data.user_message}"
            
            Task:
            Decide if you have enough information to provide a TRULY helpful, data-driven answer.
            - If YES, return: {{"action": "final_answer"}}
            - If NO, select ONE tool to call: {{"action": "call_tool", "tool": "tool_name"}}
            
            Return ONLY a JSON object.
            """
            
            decision_resp = generate_with_retry(gemini_model, step_prompt)
            try:
                import json # Ensure json is imported for this scope
                match = re.search(r"(\{.*\})", decision_resp.text, re.DOTALL)
                decision = json.loads(match.group(1)) if match else {}
            except:
                break # Fallback to final answer if JSON fails
            
            if decision.get("action") == "final_answer" or not decision.get("tool"):
                break
                
            tool_name = decision["tool"]
            print(f"🤖 Agent Step {step+1}: Calling {tool_name} for {data.student_username}")
            
            # Map tool name string to client method
            # The original code had a `tool_method = getattr(...)` which was not used.
            # The explicit if/elif structure is clearer and safer for specific tool calls.
            if tool_name == "get_project_context": result = client.get_project_context(data.student_username)
            elif tool_name == "get_student_logs": result = client.get_recent_logs(data.student_username)
            elif tool_name == "get_viva_stats": result = client.get_viva_stats(data.student_username)
            elif tool_name == "get_group_details": result = client.get_group_details(data.student_username)
            elif tool_name == "get_project_audit": result = client.get_project_audit(data.student_username)
            elif tool_name == "get_tasks": result = client.get_tasks(data.student_username)
            elif tool_name == "get_assignments": result = client.get_assignments(data.student_username)
            elif tool_name == "get_project_artifacts": result = client.get_project_artifacts(data.student_username)
            else: result = f"Unknown tool: {tool_name}"
            
            history.append({"step": step+1, "tool": tool_name, "observation": result})

        # Final Answer Generation
        final_prompt = f"""
        Act as a "Real" Agentic Project Mentor.
        
        [GATHERED DATABASE EVIDENCE]
        {json.dumps(history, indent=2) if history else "Consulted internal expertise."}
        
        [USER QUERY]
        "{data.user_message}"
        
        [INSTRUCTIONS]
        - Provide a deeply insightful answer based on the GATHERED EVIDENCE.
        - Cross-reference different data points (e.g., "I see you didn't finish Task X, which might explain the score in your recent Viva").
        - If the evidence shows $0$ scores or placeholders, explain them as a technical auditor would.
        - Be authoritative yet mentoring.
        """
        
        final_response = generate_with_retry(gemini_model, final_prompt)
        return {"response": final_response.text, "agent_steps": history}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Agentic Chat failed: {str(e)}"}


@app.get("/")
def read_root():
    return {"status": "AI Microservice is running."}

@app.post("/extract-keywords")
def extract_keywords(data: TextIn):
    try:
        # Use simple extraction or API
        # ml6team/keyphrase-extraction-distilbert-inspec
        output = query_hf_api({"inputs": data.text}, "ml6team/keyphrase-extraction-distilbert-inspec")
        
        if isinstance(output, list) and output and 'word' in output[0]:
             # Handle Token Classification output
             keywords = list(set([item['word'] for item in output if item.get('score', 0) > 0.5]))
             return {"keywords": keywords}
        elif isinstance(output, dict) and 'error' in output:
             return {"error": output['error']}
             
        return {"keywords": ["API Error"]}
    except Exception as e:
        return {"error": f"Failed to extract keywords: {str(e)}"}

@app.post("/summarize")
def summarize_text(data: TextIn):
    try:
        # google/pegasus-xsum
        output = query_hf_api({"inputs": data.text}, "google/pegasus-xsum")
        
        if isinstance(output, list) and output and 'summary_text' in output[0]:
            return {"summary": output[0]['summary_text']}
        elif isinstance(output, dict) and 'error' in output:
             return {"error": output['error']}
             
        return {"summary": "Summary unavailable."}
    except Exception as e:
        return {"error": f"Failed to summarize text: {str(e)}"}

# --- (NEW) Sentiment Analysis Endpoint ---
@app.post("/sentiment")
def analyze_sentiment(data: TextIn):
    try:
        # cardiffnlp/twitter-roberta-base-sentiment
        # This returns list of list of dicts: [[{'label': 'LABEL_0', 'score': 0.9}]]
        output = query_hf_api({"inputs": data.text[:512]}, "cardiffnlp/twitter-roberta-base-sentiment")
        
        if isinstance(output, list) and isinstance(output[0], list):
            # Get highest score label
            scores = output[0]
            scores.sort(key=lambda x: x['score'], reverse=True)
            top_label = scores[0]['label']
            
            sentiment = "Neutral"
            if top_label == 'LABEL_0': sentiment = "Negative"
            elif top_label == 'LABEL_2': sentiment = "Positive"
            
            return {"sentiment": sentiment, "raw_label": top_label}
            
        elif isinstance(output, dict) and 'error' in output:
             return {"error": output['error']}

        return {"sentiment": "Neutral", "raw_label": "Unknown"}

    except Exception as e:
        return {"error": f"Failed to analyze sentiment: {str(e)}"}

# --- (NEW) Code Review Endpoint ---
@app.post("/review-code")
def review_code(data: CodeReviewIn):
    try:
        # Build context section
        context_note = ""
        if data.context:
            context_note = f"""
        
        📋 Project/Assignment Context:
        {data.context}
        
        ⚠️ Evaluate this code considering the above context.
        """
        
        prompt = f"""
        Act as a Senior Developer. Review the following code file: "{data.filename}".
        {context_note}
        
        Code Content:
        ```
        {data.code}
        ```
        
        Task:
        1. Analyze the code for security vulnerabilities and code quality.
        2. CRITICAL: Compare the code with the provided Project Context. 
           - Does this code belong to this specific project? 
           - Is it relevant to the project's description and tech stack?
           - If the code seems generic or unrelated (e.g., a calculator app for an E-commerce project), DRASTICALLY reduce the score and mention this in the feedback.
        
        Provide a JSON response with the following structure:
        {{
            "security_score": <0-10>,
            "quality_score": <0-10>,
            "security_issues": ["issue 1", "issue 2"],
            "optimization_tips": ["tip 1", "tip 2"],
            "ai_feedback": "General feedback summary. Explicitly state if the code matches the project context."
        }}
        Output ONLY valid JSON.
        """
        
        response = generate_with_retry(gemini_model, prompt)
        text = response.text.strip()
        
        # Extract JSON
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL | re.IGNORECASE)
        if match:
            json_str = match.group(1)
        else:
            match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
            if match:
                json_str = match.group(1)
            else:
                json_str = text
                
        try:
            result = json.loads(json_str)
            return result
        except json.JSONDecodeError:
            return {"error": "Failed to parse AI response as JSON", "raw_response": text}
            
    except Exception as e:
        return {"error": f"Code review failed: {str(e)}"}

@app.post("/generate-checkpoints")
def generate_checkpoints(data: CheckpointGenerationIn):
    try:
        prompt = f"""
        Act as a Project Manager. Create a detailed roadmap of 5-7 key checkpoints for a student project titled "{data.title}".
        
        Project Description: "{data.description}"
        Category: "{data.category}"
        
        Return a JSON object with a "checkpoints" key containing a list of objects.
        Each object must have:
        - "title": Short title of the milestone
        - "description": Detailed description of what needs to be done
        
        Example JSON Structure:
        {{
            "checkpoints": [
                {{ "title": "Database Schema Design", "description": "Design ER diagram and create SQL tables..." }},
                {{ "title": "API Implementation", "description": "Develop REST API endpoints for user auth..." }}
            ]
        }}
        Output ONLY valid JSON.
        """
        
        response = generate_with_retry(gemini_model, prompt)
        text = response.text.strip()
        
        # Extract JSON
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL | re.IGNORECASE)
        if match:
            json_str = match.group(1)
        else:
            match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
            if match:
                json_str = match.group(1)
            else:
                json_str = text
                
        try:
            result = json.loads(json_str)
            return result
        except json.JSONDecodeError:
            return {"error": "Failed to parse AI response", "raw_response": text}

    except Exception as e:
        return {"error": f"Checkpoint generation failed: {str(e)}"}

@app.post("/verify-checkpoint")
def verify_checkpoint(data: CheckpointVerificationIn):
    try:
        prompt = f"""
        ROLE: You are an expert Academic Auditor and Teaching Assistant.
        AUDIENCE: You are writing a formal report to a PROFESSOR.
        SUBJECT: Verification of a student's checkpoint submission.

        STRICT RULES:
        1. DO NOT address the student (e.g., never say "You", "Your work").
        2. ALWAYS use third-person (e.g., "The student", "The submission").
        3. Be objective and professional.
        4. Start your response with: "Professor, here is my analysis of the student's submission:"

        Checkpoint: "{data.checkpoint_title}"
        Description: "{data.checkpoint_description}"
        Project Context: "{data.project_context}"
        
        Student's Submission (Proof):
        "{data.proof_text}"
        
        Task:
        1. Verify if the proof matches the checkpoint requirements.
        2. Check for authenticity and quality.
        3. Provide your recommendation.
        
        Return JSON:
        {{
            "is_approved": <true/false>,
            "feedback": "Your formal report to the professor...",
            "suggested_progress": <0-100 integer estimate>
        }}
        Output ONLY valid JSON.
        """
        
        response = generate_with_retry(gemini_model, prompt)
        text = response.text.strip()
        
        # Extract JSON
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL | re.IGNORECASE)
        if match:
            json_str = match.group(1)
        else:
            match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
            if match:
                json_str = match.group(1)
            else:
                json_str = text
                
        try:
            result = json.loads(json_str)
            return result
        except json.JSONDecodeError:
            return {"error": "Failed to parse AI response", "raw_response": text}

    except Exception as e:
        return {"error": f"Verification failed: {str(e)}"}

@app.post("/verify-assignment")
def verify_assignment(data: AssignmentVerificationIn):
    try:
        # Construct the prompt parts
        prompt_parts = []
        
        text_prompt = f"""
        Act as a Teacher/Evaluator. Verify the student's submission for the following assignment.
        
        Assignment Type: {data.assignment_type}
        Assignment Description: "{data.description}"
        
        Project Context (The student is working on this project):
        {data.project_context}
        
        Student Submission Content (Text or File Summary):
        "{data.text_content}"
        
        Task:
        1. Check if the submission is relevant to the assignment description.
        2. CRITICAL: Check if the submission is relevant to the student's specific project (based on the context provided).
        3. If an image is provided, analyze the visual content directly.
        
        Return JSON:
        {{
            "is_approved": <true/false>,
            "score": <0-10 integer>,
            "feedback": "Specific feedback explaining why it matches or doesn't match the project context and assignment requirements."
        }}
        Output ONLY valid JSON.
        """
        prompt_parts.append(text_prompt)

        # Add image if present
        if data.image_data:
            try:
                import base64
                from PIL import Image
                import io
                
                # Decode base64 string
                image_bytes = base64.b64decode(data.image_data)
                image = Image.open(io.BytesIO(image_bytes))
                prompt_parts.append(image)
                print("Image added to prompt successfully.")
            except Exception as img_err:
                print(f"Error processing image: {img_err}")
                # Fallback to text only if image fails
        
        response = generate_with_retry(gemini_model, prompt_parts)
        text = response.text.strip()
        
        # Extract JSON
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL | re.IGNORECASE)
        if match:
            json_str = match.group(1)
        else:
            match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
            if match:
                json_str = match.group(1)
            else:
                json_str = text
                
        try:
            result = json.loads(json_str)
            return result
        except json.JSONDecodeError:
            return {"error": "Failed to parse AI response", "raw_response": text}

    except Exception as e:
        return {"error": f"Verification failed: {str(e)}"}

@app.post("/generate-project-graph")
def generate_project_graph(data: ProjectGraphIn):
    try:
        prompt = f"""
        Act as a System Architect. Create a knowledge graph for a project.
        
        Project: "{data.title}"
        Abstract: "{data.abstract}"
        Key Tasks: {data.tasks}
        
        Return a JSON object with "nodes" and "links" for a force-directed graph.
        
        Nodes must have:
        - "id": Unique string ID
        - "group": Integer (1=Core Concept, 2=Task, 3=Technology, 4=Milestone)
        - "val": Integer size (10-30)
        
        Links must have:
        - "source": Node ID
        - "target": Node ID
        
        Create at least 15 nodes linking the project concepts, technologies (Python, React, etc.), and tasks.
        
        Example JSON:
        {{
            "nodes": [
                {{"id": "Project", "group": 1, "val": 30}},
                {{"id": "Database", "group": 3, "val": 15}}
            ],
            "links": [
                {{"source": "Project", "target": "Database"}}
            ]
        }}
        Output ONLY valid JSON.
        """
        
        response = generate_with_retry(gemini_model, prompt)
        text = response.text.strip()
        
        # Extract JSON
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL | re.IGNORECASE)
        if match:
            json_str = match.group(1)
        else:
            match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
            if match:
                json_str = match.group(1)
            else:
                json_str = text
                
        try:
            result = json.loads(json_str)
            return result
        except json.JSONDecodeError:
            return {"error": "Failed to parse AI response", "raw_response": text}

    except Exception as e:
        return {"error": f"Graph generation failed: {str(e)}"}

# --- (NEW) Boss Battle Endpoints ---

class BossBattleStartIn(BaseModel):
    title: str
    abstract: str
    tech_stack: str

class BossBattleTurnIn(BaseModel):
    question: str
    user_answer: str
    project_context: str

@app.post("/start-boss-battle")
def start_boss_battle(data: BossBattleStartIn):
    try:
        prompt = f"""
        Act as a "Boss AI" named "The Deprecator". You are a skeptical, strict, and intimidating Senior System Architect.
        Your goal is to challenge the student's project design.

        Project: "{data.title}"
        Abstract: "{data.abstract}"
        Tech Stack: "{data.tech_stack}"

        Task:
        1. Generate a short, intimidating opening line introducing yourself.
        2. Ask ONE difficult, specific technical question about why they chose a certain technology or design pattern in their project.

        Return JSON:
        {{
            "boss_name": "The Deprecator",
            "opening_line": "...",
            "first_question": "..."
        }}
        Output ONLY valid JSON.
        """
        
        response = generate_with_retry(gemini_model, prompt)
        text = response.text.strip()
        
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL | re.IGNORECASE)
        if match:
            json_str = match.group(1)
        else:
            match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
            if match:
                json_str = match.group(1)
            else:
                json_str = text
                
        try:
            result = json.loads(json_str)
            return result
        except json.JSONDecodeError:
            return {"error": "Failed to parse AI response", "raw_response": text}

    except Exception as e:
        return {"error": f"Boss battle start failed: {str(e)}"}

@app.post("/boss-battle-turn")
def boss_battle_turn(data: BossBattleTurnIn):
    try:
        prompt = f"""
        Act as "The Deprecator" (Boss AI). You are in a debate with a student.

        Context: "{data.project_context}"
        My Previous Question: "{data.question}"
        Student's Answer: "{data.user_answer}"

        Task:
        1. Evaluate the student's answer. Is it logical? Does it justify their choice?
        2. Calculate "User Damage" (0-100): High if answer is weak/vague. Low if answer is strong.
        3. Calculate "AI Damage" (0-100): High if answer is strong. Low if answer is weak.
        4. Provide a short, biting feedback comment.
        5. Ask the NEXT difficult follow-up question.

        Return JSON:
        {{
            "user_damage": <0-100>,
            "ai_damage": <0-100>,
            "feedback": "...",
            "next_question": "..."
        }}
        Output ONLY valid JSON.
        """
        
        response = generate_with_retry(gemini_model, prompt)
        text = response.text.strip()
        
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL | re.IGNORECASE)
        if match:
            json_str = match.group(1)
        else:
            match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
            if match:
                json_str = match.group(1)
            else:
                json_str = text
                
        try:
            result = json.loads(json_str)
            return result
        except json.JSONDecodeError:
            return {"error": "Failed to parse AI response", "raw_response": text}

    except Exception as e:
        return {"error": f"Boss battle turn failed: {str(e)}"}

    except Exception as e:
        return {"error": f"Boss battle turn failed: {str(e)}"}

# --- (NEW) Project Mentor Endpoint ---

class ProjectMentorChatIn(BaseModel):
    user_message: str
    project_context: str
    student_performance: str = "" # Optional performance data
    github_repo_link: str = "" # Optional GitHub link

from fastapi.responses import StreamingResponse

@app.post("/project-mentor-chat")
def project_mentor_chat(data: ProjectMentorChatIn):
    try:
        # Fetch repo content if link is provided
        repo_content = ""
        # OPTIMIZATION: Do not fetch full repo by default to save tokens/bandwidth
        # only if explicitly requested or we implement a 'smart fetch' later.
        if data.github_repo_link and "analyze code" in data.user_message.lower():
             print(f"Fetching repo content from {data.github_repo_link} (User requested)...")
             try:
                full_content = clone_and_read_repo(data.github_repo_link)
                # Truncate strictly to avoid 429
                repo_content = f"\n\nGITHUB REPOSITORY CONTENT (Truncated):\n{full_content[:20000]}\n" 
             except Exception as e:
                repo_content = f"\n(Could not fetch repo: {e})\n"
        
        full_context = data.project_context + repo_content

        prompt = f"""
        Act as a friendly, encouraging, and highly technical "Project Mentor" for a student.
        
        CONTEXT:
        {full_context}
        
        STUDENT PERFORMANCE DATA:
        {data.student_performance}
        
        STUDENT MESSAGE:
        "{data.user_message}"
        
        INSTRUCTIONS:
        1. Answer the student's question based strictly on their specific project context.
        2. If the user asks about their code, check the "GITHUB REPOSITORY CONTENT" section. If it's empty, ask them to simply paste the relevant snippet or ask to "analyze code" to trigger a fetch.
        3. DO NOT HALLUCINATE file names or content.
        4. If they ask about their performance (Viva, Assignments, etc.), use the provided "Student Performance Data" to give a summary.
        5. If they ask about their performance (Viva, Assignments, etc.), use the provided "Student Performance Data" to give a summary.
        6. Be encouraging but realistic. If they are failing, give constructive advice.
        7. **POWER MODE**: If the user asks for the content of a specific file (e.g., "show me X"), and it is in the context, output the **FULL CODE** for that file. Do not summarize or truncate it.
        8. If the user asks to generate NEW code, provide a **COMPLETE, WORKING** solution. Do not give partial snippets unless asked.
        9. Keep conversational answers concise, but **IGNORE word limits** when providing code or detailed technical explanations.
        
        Return JSON:
        {{
            "mentor_response": "..."
        }}
        Output ONLY valid JSON.
        """
        
        response = generate_with_retry(gemini_model, prompt)
        text = response.text.strip()
        
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL | re.IGNORECASE)
        if match:
            json_str = match.group(1)
        else:
            match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
            if match:
                json_str = match.group(1)
            else:
                json_str = text
                
        try:
            result = json.loads(json_str)
            return result
        except json.JSONDecodeError:
            return {"error": "Failed to parse AI response", "raw_response": text}

    except Exception as e:
        return {"error": f"Mentor chat failed: {str(e)}"}

@app.post("/analyze-student-risk")
def analyze_student_risk(data: StudentRiskIn):
    try:
        prompt = f"""
        Act as an AI Educational Psychologist and Data Analyst. Analyze this student's risk of failing or dropping out.
        
        Student: {data.student_name}
        Sentiment History: {data.sentiment_history}
        Days Since Last Update: {data.days_since_last_update}
        Average Code Quality Score: {data.avg_quality_score}/10
        
        TASK:
        1. Calculate a 'Risk Score' (0-100). Higher = Higher Risk.
           - High risk factors: Frequent negative sentiment, long gaps between updates (>7 days), low quality scores (<5).
        2. Identify specific 'Risk Factors'.
        3. Suggest 'Interventions' for the teacher.
        
        Return JSON:
        {{
            "risk_score": <int>,
            "risk_level": "Low/Medium/High/Critical",
            "risk_factors": ["factor 1", "factor 2"],
            "interventions": ["suggestion 1", "suggestion 2"]
        }}
        Output ONLY valid JSON.
        """
        
        response = generate_with_retry(gemini_model, prompt)
        text = response.text.strip()
        
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL | re.IGNORECASE)
        json_str = match.group(1) if match else text
        try:
            return json.loads(json_str)
        except: # parsing manual logic if AI fails slightly or raw text
             match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
             if match: return json.loads(match.group(1))
             return {"error": "Failed to parse JSON", "raw": text}

    except Exception as e:
        return {"error": f"Risk analysis failed: {str(e)}"}

@app.post("/generate-deep-report")
def generate_deep_report(data: DeepReportIn):
    try:
        prompt = f"""
        Act as a Senior Project Manager generating a "Deep Dive Performance Report" for a student.
        
        Student: {data.student_name}
        Project: {data.project_title}
        
        Data:
        - Progress Logs: {data.logs}
        - Code Reviews: {data.code_reviews}
        - Viva Sessions: {data.viva_history}
        
        TASK:
        Generate a detailed, Markdown-formatted report checking:
        1. "Consistency": Are they working regularly?
        2. "Technical Growth": Are code scores improving?
        3. "Understanding": Did they answer Viva questions well?
        4. "Final Verdict": A paragraph summary of their journey.
        
        Return JSON:
        {{
            "report_markdown": "# Deep Dive Report for {data.student_name}..."
        }}
        Output ONLY valid JSON.
        """
        
        response = generate_with_retry(gemini_model, prompt)
        text = response.text.strip()
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL | re.IGNORECASE)
        json_str = match.group(1) if match else text
        
        try:
            return json.loads(json_str)
        except:
             match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
             if match: return json.loads(match.group(1))
             return {"error": "Failed to parse JSON", "raw": text}

    except Exception as e:
        return {"error": f"Report generation failed: {str(e)}"}

@app.post("/mock-grading")
def mock_grading(data: MockGradingIn):
    try:
        repo_content = clone_and_read_repo(data.repo_link)
        
        prompt = f"""
        Act as a Strict University Examiner. Perform a "Mock Grading" for this project.
        
        Project: {data.project_title}
        Description: {data.project_description}
        
        Codebase Content (Partial):
        {repo_content[:100000]}
        
        TASK:
        1. Grade the project out of 100 based on:
           - Innovation (20%)
           - Feasibility (20%)
           - Code Quality (30%)
           - Completeness (30%)
        2. Provide a breakdown.
        3. List "Critical Issues" that must be fixed before final submission.
        
        Return JSON:
        {{
            "predicted_grade": <int>,
            "letter_grade": "A/B/C/F",
            "rubric_breakdown": {{ "innovation": <int>, "feasibility": <int>, "quality": <int>, "completeness": <int> }},
            "critical_issues": ["issue 1", "issue 2"],
            "examiner_comments": "..."
        }}
        Output ONLY valid JSON.
        """
        
        response = generate_with_retry(gemini_model, prompt)
        text = response.text.strip()
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL | re.IGNORECASE)
        json_str = match.group(1) if match else text
        
        try:
            return json.loads(json_str)
        except:
             match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
             if match: return json.loads(match.group(1))
             return {"error": "Failed to parse JSON", "raw": text}

    except Exception as e:
        return {"error": f"Mock grading failed: {str(e)}"}


@app.post("/mock-grading")
def mock_grading(data: MockGradingIn):
    # ... existing code ...
    pass # (Original code omitted for brevity)

# --- (NEW) MCP Plagiarism Checker ---
class PlagiarismCheckIn(BaseModel):
    title: str
    abstract: str

@app.post("/check-mcp-plagiarism")
def check_mcp_plagiarism(data: PlagiarismCheckIn):
    """
    Checks for plagiarism using MCP to fetch existing abstracts 
    and SBERT for local semantic comparison.
    """
    if not sbert_model:
        return {"error": "SBERT model not loaded."}
        
    try:
        # 1. Fetch all abstracts via MCP
        client = DjangoMCPClient()
        abstracts_json = client.get_all_abstracts()
        
        existing_projects = []
        try:
             existing_projects = json.loads(abstracts_json)
        except:
             return {"error": "Failed to parse existing projects from MCP.", "raw": abstracts_json}
             
        if not existing_projects:
             return {
                 "originality_status": "PASS",
                 "score": 0,
                 "most_similar": None,
                 "analysis_report": "No existing projects to compare against."
             }
             
        # 2. Encode Current Abstract
        # We combine title + abstract for better context
        current_text = f"{data.title}. {data.abstract}"
        current_embedding = sbert_model.encode(current_text, convert_to_tensor=True)
        
        # 3. Compare with Existing
        highest_score = 0
        most_similar_project = None
        
        for proj in existing_projects:
            # Skip if it's the exact same text (re-submission) - wait, if title same maybe? 
            # If strictly same, score 1.0. We want to catch this.
            
            proj_text = f"{proj['title']}. {proj['abstract']}"
            proj_embedding = sbert_model.encode(proj_text, convert_to_tensor=True)
            
            # Cosine Similarity
            score = util.cos_sim(current_embedding, proj_embedding).item()
            
            if score > highest_score:
                highest_score = score
                most_similar_project = proj
                
        # 4. Determine Status
        status = "PASS"
        if highest_score > 0.85:
            status = "BLOCKED_HIGH_SIMILARITY"
        elif highest_score > 0.6:
            status = "WARNING_POSSIBLE_DUPLICATE"
            
        # 5. Generate Suggestions (if blocked/warning)
        suggestions = []
        if highest_score > 0.6:
             # Ask Gemini for differentiation advice
             prompt = f"""
             The student's project "{data.title}" is {highest_score*100:.1f}% similar to an existing project "{most_similar_project['title']}".
             
             Existing Abstract: "{most_similar_project['abstract']}"
             New Abstract: "{data.abstract}"
             
             Suggest 3 unique features or pivots to make the new project distinct.
             Output JSON: ["suggestion 1", "suggestion 2", "suggestion 3"]
             """
             try:
                 ai_resp = generate_with_retry(gemini_model, prompt)
                 # fast parse text list
                 import ast
                 # fallback simple parse
                 suggestions = [line.strip('- ') for line in ai_resp.text.split('\n') if line.strip().startswith('-')]
             except:
                 suggestions = ["Focus on a different target audience.", "Change the core technology stack.", "Add a unique integration."]

        return {
            "originality_status": status,
            "similarity_score": round(highest_score, 2),
            "most_similar_project": most_similar_project,
            "suggestions": suggestions
        }

    except Exception as e:
        return {"error": f"Plagiarism check failed: {str(e)}"}



# --- (NEW) MCP Viva System ---
class MCPVivaGenIn(BaseModel):
    student_username: str

@app.post("/mcp-viva-questions")
def mcp_viva_questions(data: MCPVivaGenIn):
    """
    Generates Viva Questions using MCP to fetch project context ON-DEMAND.
    True Agentic behavior: The AI decides what it needs.
    """
    try:
        client = DjangoMCPClient()
        
        # 1. Fetch Context (Agentic Step)
        # We explicitly ask for project context + recent logs to mimic the old logic
        # but in a cleaner way.
        
        print(f"🎤 Viva MCP: Fetching context for {data.student_username}...")
        project_context_json = client.get_project_context(data.student_username)
        logs_json = client.get_recent_logs(data.student_username)
        
        try:
            project_data = json.loads(project_context_json)
            # Handle string error responses from MCP
            if isinstance(project_data, str) and "Error" in project_data:
                 return {"error": project_data}
                 
            # Extract fields
            title = project_data.get("title", "Unknown Project")
            abstract = project_data.get("abstract", "No abstract available.")
            progress = project_data.get("progress", 0)
        except:
            return {"error": "Failed to parse project data from MCP."}
            
        logs_text = "No recent updates."
        try:
            logs = json.loads(logs_json)
            if isinstance(logs, list):
                logs_text = "\n".join([f"- {l['date']}: {l['task_completed']}" for l in logs])
        except:
             pass

        # 2. Generate Questions (Gemini)
        prompt = f"""
        Generate 5 technical viva voce questions for:
        Project: "{title}"
        Abstract: "{abstract}"
        Current Progress: {progress}%
        
        Recent Activity & Code Evidence:
        {logs_text}
        
        Task:
        1. Ask questions relevant to the EXACT stage of the project.
        2. IF CODE SNIPPETS ARE PRESENT ABOVE, ask 1-2 specific questions about that code (e.g., "In your 'auth.py', why did you use...").
        3. Ask about the specific technologies mentioned in the abstract.
        4. Do not ask generic questions. Be specific.
        
        Return JSON:
        {{
            "questions": ["Q1", "Q2", "Q3", "Q4", "Q5"]
        }}
        """
        
        response = generate_with_retry(gemini_model, prompt)
        
        # Parse JSON
        text = response.text.strip()
        match = re.search(r"(\{.*\})", text, re.DOTALL)
        if match:
             return json.loads(match.group(1))
        else:
             return {"questions": [text] } # Fallback

    except Exception as e:
        return {"error": f"Viva generation failed: {str(e)}"}

class MCPVivaEvalIn(BaseModel):
    question: str
    answer: str
    student_username: str

@app.post("/mcp-viva-eval")
def mcp_viva_eval(data: MCPVivaEvalIn):
    try:
        client = DjangoMCPClient()
        # We need context to evaluate correctness!
        project_context_json = client.get_project_context(data.student_username)
        try:
             project_data = json.loads(project_context_json)
             abstract = project_data.get("abstract", "")
        except:
             abstract = ""
             
        prompt = f"""
        Evaluate this Student Answer for a Viva Question.
        
        Project Abstract: "{abstract}"
        Question: "{data.question}"
        Student Answer: "{data.answer}"
        
        Task:
        1. Score accuracy (0-10).
        2. Provide short feedback.
        
        Return JSON:
        {{
            "score": <int>,
            "feedback": "..."
        }}
        """
        
        response = generate_with_retry(gemini_model, prompt)
        text = response.text.strip()
        match = re.search(r"(\{.*\})", text, re.DOTALL)
        if match: return json.loads(match.group(1))
        return {"error": "Failed to parse evaluation"}
        
    except Exception as e:
         return {"error": f"Evaluation failed: {str(e)}"}

# --- (NEW) Groq TTS Streaming Endpoint (GET) ---
@app.get("/generate-voice-get")
def generate_voice_get(text: str, voice: str = "Atlas-PlayAI"):
    TTS_ENDPOINT = "https://api.groq.com/openai/v1/audio/speech"
    MODEL = "canopylabs/orpheus-v1-english"
    # VOICE variable is now the argument

    # Try up to 3 times (or all keys)
    max_retries = len(groq_manager.api_keys)
    
    for attempt in range(max_retries):
        try:
            current_key = groq_manager.get_current_key()
            
            headers = {
                "Authorization": f"Bearer {current_key}",
                "Content-Type": "application/json",
                "Accept": "audio/wav"
            }

            payload = {
                "model": MODEL,
                "input": text,
                "voice": voice,
                "response_format": "wav"
            }

            print(f"Generating voice (GET) using Key #{groq_manager.current_index + 1}...")
            
            # Streaming request to Groq
            # Increased timeout to 60s to handle long texts
            r = requests.post(TTS_ENDPOINT, headers=headers, json=payload, stream=True, timeout=60)

            # If success, return immediately
            if r.status_code == 200:
                print("✅ Groq Request Successful")
                return StreamingResponse(r.iter_content(chunk_size=8192), media_type="audio/wav")
            
            # If rate limit (429), rotate and retry
            if r.status_code == 429:
                print(f"⛔ Rate Limit Hit on Key #{groq_manager.current_index + 1}")
                groq_manager.rotate_key()
                continue # Retry loop
            
            # Other error
            print(f"Groq TTS Error: {r.status_code} - {r.text}")
            return {"error": f"Groq TTS failed: {r.text}"}

        except Exception as e:
            print(f"Request Exception: {e}")
            groq_manager.rotate_key()

    return {"error": "All Groq keys exhausted or failed."}

# --- (NEW) Groq TTS Endpoint (POST) ---
# Updated to use Key Manager as well
class VoiceGenerationIn(BaseModel):
    text: str

@app.post("/generate-voice")
def generate_voice(data: VoiceGenerationIn):
    TTS_ENDPOINT = "https://api.groq.com/openai/v1/audio/speech"
    MODEL = "canopylabs/orpheus-v1-english"
    VOICE = "daniel"

    max_retries = len(groq_manager.api_keys)

    for attempt in range(max_retries):
        try:
            current_key = groq_manager.get_current_key()
            headers = {
                "Authorization": f"Bearer {current_key}",
                "Content-Type": "application/json",
                "Accept": "audio/wav"
            }
            payload = {
                "model": MODEL,
                "input": data.text,
                "voice": VOICE,
                "response_format": "wav"
            }

            print(f"Generating voice (POST) using Key #{groq_manager.current_index + 1}...")
            r = requests.post(TTS_ENDPOINT, headers=headers, json=payload, stream=True, timeout=60)

            if r.status_code == 200:
                return StreamingResponse(r.iter_content(chunk_size=8192), media_type="audio/wav")
            
            if r.status_code == 429:
                groq_manager.rotate_key()
                continue
            
            return {"error": f"Groq TTS failed: {r.text}"}

        except Exception as e:
            groq_manager.rotate_key()
            
    return {"error": "All Groq keys exhausted."}





@app.post("/generate-docs")
def generate_docs(data: AuditCodeIn):
    """
    Generates documentation (README style) by analyzing the repo structure and key files.
    """
    try:
        from github_api import get_repo_structure, get_file_content
        
        # 1. Fetch Structure
        structure = get_repo_structure(data.github_repo_link)
        if "error" in structure: return {"error": structure['error']}
        
        tree = structure.get("tree", [])
        paths = [item["path"] for item in tree]
        files_list = "\n".join(paths[:200])
        
        # 2. Heuristic: Read existing README or Package files
        important_files = [p for p in paths if p.lower() in ['readme.md', 'package.json', 'requirements.txt', 'setup.py']]
        
        context_files = ""
        for f in important_files:
            res = get_file_content(data.github_repo_link, f)
            if "content" in res:
                context_files += f"\n--- {f} ---\n{res['content'][:5000]}\n"
                
        # 3. Generate Docs Prompt
        prompt = f"""
        Act as a Technical Writer. Generate a comprehensive README.md for this project.
        
        Project Context: {data.project_context}
        
        File Structure:
        {files_list}
        
        Key Files Content:
        {context_files}
        
        Task:
        Write a professional README.md that includes:
        - Project Title & Description
        - Tech Stack (inferred from structure/requirements)
        - Key Features
        - Setup/Installation Instructions (inferred)
        
        Return JSON: {{"markdown_content": "..."}}
        """
        
        response = generate_with_retry(gemini_model, prompt)
        text = response.text.strip()
        
        # Extract JSON
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL | re.IGNORECASE)
        json_str = match.group(1) if match else text
        try:
            return json.loads(json_str)
        except:
             # Fallback if raw markdown is returned
            return {"markdown_content": text}

    except Exception as e:
        return {"error": str(e)}

@app.post("/analyze-issues")
def analyze_issues(data: AuditCodeIn):
    """
    Fetches GitHub issues and classifies them using AI.
    """
    try:
        from github_api import get_issues
        

        res = get_issues(data.github_repo_link)
        
        # Handle potential error dict or list of issues
        if isinstance(res, dict) and "error" in res: 
            return {"error": res['error']}
            
        issues = res
        if not issues or not isinstance(issues, list): 
            return {"analysis": "No open issues found or could not fetch issues."}
        

        if len(issues) == 0:
             return {"analysis": "No open GitHub issues (tickets) found in this repository."}
        
        issues_summary = ""
        for i in issues:
            issues_summary += f"- Issue #{i['number']}: {i['title']}\n  Body: {i['body'][:200]}...\n\n"
            
        prompt = f"""
        Act as a Project Manager. Analyze these GitHub issues.
        
        Issues List:
        {issues_summary}
        
        Task:
        1. Categorize each issue (Bug, Feature, Question).
        2. Prioritize them (High, Medium, Low).
        3. Suggest a quick fix or next step for the Top 3 most critical ones.
        
        Return JSON: {{"analysis": "..."}}
        """
        
        response = generate_with_retry(gemini_model, prompt)
        text = response.text.strip()
        
        # Extract JSON
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL | re.IGNORECASE)
        json_str = match.group(1) if match else text
        try:
            return json.loads(json_str)
        except:
            return {"analysis": text}

    except Exception as e:
        return {"error": str(e)}

# --- Teacher Chat with Deep Context ---

class MCPTeacherChatIn(BaseModel):
    student_username: str
    user_message: str

@app.post("/mcp-teacher-chat")
def mcp_teacher_chat(data: MCPTeacherChatIn):
    """
    Agentic Teacher Assistant.
    Provides a deep dive for professors by gathered evidence across tools.
    """
    try:
        client = DjangoMCPClient()
        history = []
        max_steps = 4 # Teachers get more depth
        
        for step in range(max_steps):
            step_prompt = f"""
            You are a Senior AI Teaching Assistant overseeing University Projects.
            Student: {data.student_username}
            
            Current Data Gathered:
            {json.dumps(history, indent=2) if history else "No data yet."}
            
            Tools (A to Z Context):
            1. `get_project_context`: Basic info.
            2. `get_student_logs`: Progress & code snippets.
            3. `get_viva_stats`: Full Viva History (Q&A).
            4. `get_group_details`: Team members & Roles.
            5. `get_project_audit`: Quality & Security Scores.
            6. `get_tasks`: Kanban board status.
            7. `get_assignments`: Active assignments.
            8. `get_project_artifacts`: Uploaded documents.
            
            Teacher Question: "{data.user_message}"
            
            Task:
            Gather evidence to provide a 360-degree answer.
            - If you need more data (e.g. want to see why they scored low by checking code/tasks), return: {{"action": "call_tool", "tool": "tool_name"}}
            - If ready for an expert summary, return: {{"action": "final_answer"}}
            
            Return JSON ONLY.
            """
            
            decision_resp = generate_with_retry(gemini_model, step_prompt)
            try:
                import json
                match = re.search(r"(\{.*\})", decision_resp.text, re.DOTALL)
                decision = json.loads(match.group(1)) if match else {}
            except:
                break
                
            if decision.get("action") == "final_answer" or not decision.get("tool"):
                break
                
            tool_name = decision["tool"]
            print(f"👩‍🏫 Teacher Agent Step {step+1}: Calling {tool_name}")
            
            if tool_name == "get_project_context": result = client.get_project_context(data.student_username)
            elif tool_name == "get_student_logs": result = client.get_recent_logs(data.student_username)
            elif tool_name == "get_viva_stats": result = client.get_viva_stats(data.student_username)
            elif tool_name == "get_group_details": result = client.get_group_details(data.student_username)
            elif tool_name == "get_project_audit": result = client.get_project_audit(data.student_username)
            elif tool_name == "get_tasks": result = client.get_tasks(data.student_username)
            elif tool_name == "get_assignments": result = client.get_assignments(data.student_username)
            elif tool_name == "get_project_artifacts": result = client.get_project_artifacts(data.student_username)
            else: result = f"Unknown tool: {tool_name}"
            
            history.append({"step": step+1, "tool": tool_name, "observation": result})

        # Final Professor-Level Analysis
        final_prompt = f"""
        Act as a Professional Academic Advisor and Technical Auditor.
        
        [EVIDENCE GATHERED FROM DATABASE]
        {json.dumps(history, indent=2) if history else "No specific data found in tools."}
        
        [PROFESSOR'S INQUIRY]
        "{data.user_message}"
        
        [INSTRUCTIONS]
        You are speaking directly to the Professor/Teacher.
        1. SYNTHESIZE the evidence into a natural, professional response. 
        2. DO NOT just list the tools used. Interpret the data.
        3. If you found specific metrics (scores, Viva answers, missing tasks), CITE THEM explicitly.
        4. If data is missing (e.g., no submission), state that clearly and suggest the teacher nudge the student.
        5. Structure your answer:
           - **Executive Summary**: Direct answer to the question.
           - **Key Findings**: Bullet points with specific data (Viva score, Audit Result, etc.).
           - **Recommendation**: What should the teacher do next?
        
        Style: Formal, slightly strict but helpful.
        """
        
        final_response = generate_with_retry(gemini_model, final_prompt)
        return {"response": final_response.text, "audit_trail": history}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Teacher Agent failed: {str(e)}"}

if __name__ == "__main__":
    print("Starting FastAPI server on http://127.0.0.1:8001")
    uvicorn.run(app, host="127.0.0.1", port=8001)

# --- Refactoring Endpoint ---

class RefactorRequest(BaseModel):
    code: str
    file_name: str
    issue_description: str
    tech_stack: str = "Generic"

@app.post("/generate-refactor")
async def generate_refactor(request: RefactorRequest):
    prompt = f"""
    You are an expert Senior Software Engineer.
    Refactor the following code to fix the issue described.
    
    File: {request.file_name}
    Tech Stack: {request.tech_stack}
    Issue: {request.issue_description}
    
    CODE:
    ```
    {request.code}
    ```
    
    INSTRUCTIONS:
    1. Return ONLY the complete refactored code. 
    2. Do NOT wrap it in markdown code blocks. Just return the raw code text.
    3. Maintain existing style and comments where appropriate.
    4. Focus primarily on fixing the issue.
    """
    
    try:
        # We pass 'None' for model as generate_with_retry uses the manager's model
        response = generate_with_retry(None, prompt)
        refactored_code = response.text
        
        # Cleanup potential markdown wrapping if the model ignores instruction
        if refactored_code.strip().startswith("```"):
            lines = refactored_code.strip().split("\n")
            # Remove first line (```language)
            lines = lines[1:]
            # Remove last line if it is ```
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            refactored_code = "\n".join(lines)
                
        return {"refactored_code": refactored_code}
        
    except Exception as e:
        print(f"Refactor generation failed: {e}")
        return {"error": str(e)}
