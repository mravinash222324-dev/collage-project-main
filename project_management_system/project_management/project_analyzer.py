import re
import time
import json
import PIL.Image
import pypdf
# import whisper
# import torch # Removed
import logging
import os # Added for env vars
import requests # Added for HF API

from google import genai
from google.genai import types, errors
import google.api_core.exceptions as google_exceptions
from django.conf import settings

# import ollama  # local fallback chat
from project_management.utils import clone_and_read_repo # Import the local utility

from groq import Groq
import requests
# from sentence_transformers import SentenceTransformer, util # Removed for Vercel
import numpy as np # efficient math

# Configure logging
logger = logging.getLogger(__name__)

class ProjectAnalyzer:
    def __init__(self):
        # Load the pool of keys
        self.api_keys = getattr(settings, 'GEMINI_KEY_POOL', [settings.GEMINI_API_KEY])
        self.current_key_index = 0
        
        # Initialize with the first key
        self._configure_client()
        
        # Configure Groq (Fallback) With Key Pool
        self.groq_keys = getattr(settings, 'GROQ_KEY_POOL', [])
        # Fallback to single key if pool is empty/undefined but single key exists
        single_key = getattr(settings, 'GROQ_API_KEY', os.environ.get("GROQ_API_KEY"))
        if not self.groq_keys and single_key:
             self.groq_keys = [single_key]
             
        self.current_groq_index = 0
        self.groq_client = None
        self._configure_groq()
        
        # Fallback Local Model
        self.local_model = "gemma:2b"
        
        # Initialize Similarity Model for Plagiarism Checks
        # self.similarity_model = SentenceTransformer('all-MiniLM-L6-v2') 
        # logger.info("✅ SentenceTransformer (all-MiniLM-L6-v2) loaded successfully.")
        self.hf_token = getattr(settings, 'HUGGINGFACE_API_TOKEN', os.environ.get("HUGGINGFACE_API_TOKEN"))
        self.hf_api_url = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2"
        if not self.hf_token:
             logger.warning("⚠️ No HuggingFace Token found. Plagiarism checks may fail.")

    def _configure_client(self):
        """Configures the Gemini client with the current key."""
        if not self.api_keys:
             logger.warning("No Gemini Keys found.")
             return
             
        current_key = self.api_keys[self.current_key_index]
        current_key = self.api_keys[self.current_key_index]
        # New SDK Client
        self.client = genai.Client(api_key=current_key)
        logger.info(f"Switched to Gemini Key #{self.current_key_index + 1}")

    def _configure_groq(self):
        """Configures Groq client with the current key from the pool."""
        if not self.groq_keys:
            logger.warning("⚠️ No Groq Keys configured.")
            return

        current_key = self.groq_keys[self.current_groq_index]
        try:
            self.groq_client = Groq(api_key=current_key)
            logger.info(f"✅ Groq client configured (Key #{self.current_groq_index + 1}).")
        except Exception as e:
             logger.error(f"❌ Failed to configure Groq: {e}")

    def _rotate_groq_key(self):
        """Switches to the next Groq key in the pool."""
        if not self.groq_keys: return
        self.current_groq_index = (self.current_groq_index + 1) % len(self.groq_keys)
        logger.warning(f"🔄 Rotating Groq Key to #{self.current_groq_index + 1}")
        self._configure_groq()

    def _rotate_key(self):
        """Switches to the next API key in the pool."""
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        self._configure_client()

    def _extract_json(self, text):
        """
        Robustly extracts and parses JSON from AI output.
        Handles Markdown code blocks and raw JSON strings.
        """
        if not text:
            return None
            
        # 1. Try to find JSON within code blocks
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", text, re.DOTALL | re.IGNORECASE)
        if match:
            json_str = match.group(1)
        else:
            # 2. Try to find the first open brace/bracket to the last close brace/bracket
            match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
            if match:
                json_str = match.group(1)
            else:
                # 3. Assume the whole text might be JSON
                json_str = text

        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            logger.warning(f"JSON Decode Error on text: {text[:100]}...")
            return None

    
    # -----------------------
    # Hybrid AI Engine
    # -----------------------
    def _ask_ai_with_fallback(self, prompt, task_name="Generic Task", expect_json=False):
        """
        PRIORITY ORDER:
        1. Groq (Llama 3) - Fast & Primary
        2. Gemini (Flash) - Backup
        3. Hugging Face (Mistral) - Fallback
        4. Ollama (Local) - Last Resort
        """
        
        # --- PRIORITY 1: GROQ (Llama 3) ---
        # The user specifically requested Groq as primary for efficiency
        for attempt in range(len(self.groq_keys) or 1):
            if self.groq_client:
                try:
                    chat_completion = self.groq_client.chat.completions.create(
                        messages=[
                            {
                                "role": "system",
                                "content": "You are a helpful and precise technical assistant." + (" Return ONLY JSON." if expect_json else "")
                            },
                            {
                                "role": "user",
                                "content": prompt,
                            }
                        ],
                        model="llama-3.1-8b-instant", 
                        temperature=0.5,
                        max_tokens=2048, # Increased for detailed summaries
                        top_p=1,
                        stop=None,
                        stream=False,
                    )
                    logger.info(f"✅ Groq (Primary) handled {task_name} successfully!")
                    return chat_completion.choices[0].message.content
                except Exception as e:
                     error_msg = str(e).lower()
                     if "429" in error_msg or "rate limit" in error_msg:
                         logger.warning(f"⚠️ Groq Key Exhausted: {error_msg}. Rotating...")
                         self._rotate_groq_key()
                         time.sleep(1)
                     else:
                        logger.error(f"⚠️ Groq Failed: {e}. Switching to Gemini...")
                        break # Exit Groq loop, try Gemini
            else:
                break

        # --- PRIORITY 2: GEMINI (Flash) ---
        for attempt in range(len(self.api_keys)):
            try:
                # Set a short timeout so we rotate quickly if it hangs
                # New SDK Usage
                response = self.client.models.generate_content(
                    model='gemini-flash-latest',
                    contents=prompt
                )
                logger.info(f"✅ Gemini (Backup) handled {task_name}.")
                return response.text.strip()
            
            except errors.ClientError as e:
                if e.code == 429:
                    logger.warning(f"⚠️ Gemini Key #{self.current_key_index + 1} Exhausted (429). Rotating...")
                    self._rotate_key()
                    time.sleep(1)
                else:
                    logger.error(f"❌ Gemini Client Error: {e}")
                    self._rotate_key()
        
        # --- IF WE GET HERE, BOTH GROQ AND GEMINI FAILED ---
        logger.warning(f"⚠️ All Primary AIs Failed for {task_name}. Switching to Fallbacks...")

        # --- FALLBACK 3: HUGGING FACE INFERENCE ---
        hf_token = getattr(settings, 'HUGGINGFACE_API_TOKEN', os.environ.get("HUGGINGFACE_API_TOKEN"))
        if hf_token:
            logger.info("Switching to HuggingFace (Mistral)...")
            API_URL = "https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.3"
            headers = {"Authorization": f"Bearer {hf_token}"}
            
            try:
                payload = {
                    "inputs": f"[INST] {prompt} [/INST]",
                    "parameters": {"max_new_tokens": 1024, "return_full_text": False}
                }
                response = requests.post(API_URL, headers=headers, json=payload)
                result = response.json()
                
                if isinstance(result, list) and 'generated_text' in result[0]:
                    logger.info("✅ HuggingFace saved the day!")
                    return result[0]['generated_text']
                else:
                    logger.error(f"❌ HF Error: {result}")
            except Exception as e:
                logger.error(f"❌ HuggingFace Fallback Failed: {e}")

        # --- FALLBACK 3: LOCAL OLLAMA ---
        logger.error(f"❌ All Cloud AIs Failed. Switching to Local Ollama ({self.local_model})...")

        # Smart truncation for local model context windows
        if len(prompt) > 3500:
            head = prompt[:2000]
            tail = prompt[-1000:]
            simplified_prompt = f"{head}\n... [Middle removed for length] ...\n{tail}"
        else:
            simplified_prompt = prompt
        
        # If we expect JSON, append a strong instruction for the smaller model
        if expect_json:
            simplified_prompt += "\n\nIMPORTANT: Return ONLY Valid JSON. No markdown, no explanations."

        try:
            # Lazy import to avoid crash if not installed
            import ollama 
            response = ollama.chat(model=self.local_model, messages=[
                {'role': 'system', 'content': 'You are a precise technical assistant.'},
                {'role': 'user', 'content': simplified_prompt},
            ])
            logger.info(f"✅ Local Ollama saved the day!")
            return response['message']['content']
        except Exception as local_e:
            logger.critical(f"❌ Total System Failure: {local_e}")
            return None

    def _ask_ai_gemini_first(self, prompt, task_name="Teacher Task", expect_json=False):
        """
        PRIORITY ORDER (Teacher AI Special):
        1. Gemini (Flash) - Primary (Best for Context)
        2. Groq (Llama 3) - Backup
        3. Hugging Face - Fallback
        """
        
        # --- PRIORITY 1: GEMINI (Flash) ---
        for attempt in range(len(self.api_keys)):
            try:
                # Set a short timeout
                # New SDK Usage
                # New SDK Usage
                response = self.client.models.generate_content(
                    model='gemini-flash-latest',
                    contents=prompt
                )
                logger.info(f"✅ Gemini (Primary) handled {task_name}.")
                return response.text.strip()
            
            except google_exceptions.ResourceExhausted:
                logger.warning(f"⚠️ Gemini Key #{self.current_key_index + 1} Exhausted. Rotating...")
                self._rotate_key()
                time.sleep(1) 
            except Exception as e:
                logger.error(f"⚠️ Gemini Error on Key #{self.current_key_index + 1}: {e}")
                self._rotate_key()

        # --- PRIORITY 2: GROQ (Llama 3) ---
        logger.warning(f"⚠️ Gemini Failed for {task_name}. Switching to Groq...")
        
        for attempt in range(len(self.groq_keys) or 1):
            if self.groq_client:
                try:
                    chat_completion = self.groq_client.chat.completions.create(
                        messages=[
                            {
                                "role": "system",
                                "content": "You are a helpful and precise technical assistant." + (" Return ONLY JSON." if expect_json else "")
                            },
                            {
                                "role": "user",
                                "content": prompt,
                            }
                        ],
                        model="openai/gpt-oss-120b", 
                        temperature=0.5,
                        max_tokens=2048,
                        top_p=1,
                        stop=None,
                        stream=False,
                    )
                    logger.info(f"✅ Groq (Backup) handled {task_name} successfully!")
                    return chat_completion.choices[0].message.content
                except Exception as e:
                     error_msg = str(e).lower()
                     if "429" in error_msg or "rate limit" in error_msg:
                         logger.warning(f"⚠️ Groq Key Exhausted: {error_msg}. Rotating...")
                         self._rotate_groq_key()
                         time.sleep(1)
                     else:
                        logger.error(f"⚠️ Groq Failed: {e}.")
                        break 
            else:
                break

        # --- FALLBACK: Reuse existing fallback logic ---
        return self._ask_ai_with_fallback(prompt, task_name, expect_json)


    # -----------------------
    # Plagiarism Layers
    # -----------------------
    def _get_word_overlap(self, text1, text2):
        """
        Layer 1: Literal Word Overlap (Jaccard Similarity).
        Returns a float 0-1 representing the ratio of unique word overlap.
        """
        def get_words(text):
            # Simple word extraction: lowercase, alphanumeric
            return set(re.findall(r'\w+', text.lower()))
            
        words1 = get_words(text1)
        words2 = get_words(text2)
        
        if not words1 or not words2:
            return 0.0
            
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union)

    def _extract_project_fingerprint(self, title, abstract):
        """
        Layer 3: Extract structured logical components of a project.
        """
        prompt = f"""
Extract the core technical logic of this project submission.
Title: {title}
Abstract: {abstract}

Output ONLY JSON with these keys:
- problem_statement: High-level issue being solved.
- input_sources: Data or sensors used.
- core_process: Primary algorithm, logic, or transformation.
- expected_output: Result or action.
- primary_tech: Key frameworks or hardware.

Be technical and precise. Keep it to one sentence per point.
"""
        response = self._ask_ai_with_fallback(prompt, "Fingerprint Extraction", expect_json=True)
        return self._extract_json(response)

    def _get_hf_similarity(self, source_text, comparison_texts):
        """
        Helper to get similarity scores using the Sentence Similarity API.
        Returns a list of floats corresponding to the comparison_texts.
        """
        if not self.hf_token or not comparison_texts: return []
        
        headers = {"Authorization": f"Bearer {self.hf_token}"}
        # The API expects "inputs": {"source_sentence": "...", "sentences": ["..."]}
        payload = {
            "inputs": {
                "source_sentence": source_text,
                "sentences": comparison_texts
            },
            "options": {"wait_for_model": True}
        }
        
        try:
            response = requests.post(self.hf_api_url, headers=headers, json=payload)
            if response.status_code == 200:
                result = response.json()
                # Expected result: [score1, score2, ...]
                if isinstance(result, list):
                     return result
            else:
                logger.error(f"HF API Error: {response.text}")
        except Exception as e:
            logger.error(f"HF API Exception: {e}")
        return []

    def check_plagiarism_and_suggest_features(self, title, abstract, existing_submissions):
        """
        Performs semantic check and scoring using structured JSON output.
        Now enhanced with Hugging Face Sentence Transformers for deep semantic matching.
        """
        
        # --- 1. Hugging Face Semantic Check (API VERSION) ---
        hf_result = {
            "is_similar": False,
            "score": 0.0,
            "most_similar_project": None
        }

        if self.hf_token and existing_submissions:
            try:
                # NEW Submission Fingerprint (Layer 3)
                new_fingerprint = self._extract_project_fingerprint(title, abstract)
                logger.info(f"Fingerprint extracted for {title}")

                # Prepare batch for similarity check
                candidate_abstracts = []
                candidate_submissions = []

                for submission in existing_submissions:
                    sub_abstract = submission.get('abstract_text') if isinstance(submission, dict) else getattr(submission, 'abstract_text', '')
                    if sub_abstract:
                        candidate_abstracts.append(sub_abstract)
                        candidate_submissions.append(submission)

                # Get all semantic scores in one API call
                semantic_scores = []
                if candidate_abstracts:
                     semantic_scores = self._get_hf_similarity(abstract, candidate_abstracts)
                
                # Save all scores for filtering
                scored_submissions = []
                
                highest_score = 0.0
                highest_literal_score = 0.0
                best_match = None
                
                for idx, submission in enumerate(candidate_submissions):
                    sub_abstract = candidate_abstracts[idx]
                    
                    # Semantic Score (from API)
                    sem_score = semantic_scores[idx] if idx < len(semantic_scores) else 0.0

                    lit_score = self._get_word_overlap(abstract, sub_abstract)
                    
                    # Weighted Score (Bias towards semantic)
                    final_score = max(sem_score, lit_score)
                    
                    scored_submissions.append((final_score, submission))
                    
                    if sem_score > highest_score:
                        highest_score = sem_score
                        best_match = submission
                    if lit_score > highest_literal_score:
                        highest_literal_score = lit_score

                hf_result["score"] = highest_score
                hf_result["literal_score"] = highest_literal_score
                
                # Check thresholds
                if highest_score > 0.70 or highest_literal_score > 0.40:
                    hf_result["is_similar"] = True
                    hf_result["most_similar_project"] = best_match

                # --- OPTIMIZATION: FILTER CONTEXT FOR GEMINI ---
                # Sort by score DESC and take Top 5
                scored_submissions.sort(key=lambda x: x[0], reverse=True)
                top_candidates = [x[1] for x in scored_submissions[:5]]
                logger.info(f"Generated Audit Context reduced to {len(top_candidates)} items (from {len(existing_submissions)}).")
                
                # Use ONLY these for Gemini
                relevant_submissions = top_candidates

            except Exception as e:
                logger.error(f"Error in plagiarism SBERT pipeline: {e}")
                relevant_submissions = existing_submissions[:5] # Fallback: First 5
        else:
            # No SBERT? Just take last 5 (Assume temporal relevance) or first 5
            # Taking everything risks token limits. Let's cap at 10.
            relevant_submissions = existing_submissions[:10]

        # --- 2. Prepare Context for Gemini ---
        existing_projects_text = "No existing projects."
        if relevant_submissions:
            numbered_list = []
            for i, submission in enumerate(relevant_submissions, 1):
                title_s = submission.get('title') if isinstance(submission, dict) else getattr(submission, 'title', 'Unknown')
                abstract_s = submission.get('abstract_text') if isinstance(submission, dict) else getattr(submission, 'abstract_text', 'No Abstract')
                # Include fingerprint if available
                fp = submission.get('logical_fingerprint') if isinstance(submission, dict) else getattr(submission, 'logical_fingerprint', None)
                fp_info = f" [Fingerprint: {json.dumps(fp)}]" if fp else ""
                
                # Truncate abstracts to save tokens
                abstract_s = (abstract_s[:300] + '..') if len(abstract_s) > 300 else abstract_s
                numbered_list.append(f"Project #{i}: {title_s} - {abstract_s}{fp_info}")
            existing_projects_text = "\n".join(numbered_list)

        # Inject HF findings into the prompt
        hf_note = ""
        if hf_result["is_similar"]:
            match = hf_result["most_similar_project"]
            match_title = match.get('title') if isinstance(match, dict) else getattr(match, 'title', 'Unknown')
            
            # --- AUTO-BLOCK LOGIC ---
            # Block if extreme semantic similarity OR high literal overlap
            if hf_result["score"] > 0.85 or hf_result.get("literal_score", 0) > 0.70:
                logger.info("🛑 Auto-Blocking due to Extreme Match")
                return {
                    "originality_status": "BLOCKED_HIGH_SIMILARITY",
                    "most_similar_project": {
                        "title": match_title,
                        "abstract_text": match.get('abstract_text') if isinstance(match, dict) else getattr(match, 'abstract_text', ""),
                        "student": match.get("student__username") if isinstance(match, dict) else getattr(match, "student", "N/A")
                    },
                    "plagiarism_score": 10,
                    "relevance": 0,
                    "feasibility": 0,
                    "innovation": 0,
                    "suggested_features": ["Please submit an original project idea."],
                    "full_report": f"Auto-blocked: High similarity detected (Semantic: {hf_result['score']:.2f}, Literal: {hf_result.get('literal_score', 0):.2f}) with existing project '{match_title}'."
                }

            hf_note = f"""
            CRITICAL WARNING: HIGH SIMILARITY DETECTED ({hf_result['score']:.2f}/1.0) with "{match_title}". 
            
            [STRUCTURAL FINGERPRINT OF NEW PROJECT]
            {json.dumps(new_fingerprint, indent=2) if new_fingerprint else "Not available"}

            Compare labels cautiously. If the logical flow (Inputs -> Process -> Output) is the same as an existing project, BLOCK it.
            """

        prompt = f"""
SYSTEM: You are the Global Plagiarism Scanner for the university.
TASK: Scan the provided DATABASE of existing projects and check if the NEW SUBMISSION is a duplicate of any existing idea.

[NEW SUBMISSION]
Title: "{title}"
Abstract: "{abstract}"

{hf_note}

[DATABASE OF EXISTING PROJECTS]
{existing_projects_text}

Output a JSON object with these EXACT keys:
{{
    "plagiarism_status": "BLOCKED" or "OK",
    "most_similar_project_index": <integer (1-based index from list above) or null>,
    "analysis_thought": "1. Difference in Domain? ... 2. Difference in Goal? ... 3. Conclusion?",
    "plagiarism_score": <0-10>,
    "relevance_score": <0-10>,
    "feasibility_score": <0-10>,
    "innovation_score": <0-10>,
    "suggested_features": "<If BLOCKED, suggest 2-3 features. If OK, string 'None'>",
    "full_report": "<Final verdict based on analysis>"
}}

Verification Rules:
1. **The "Same Idea" Test**: Functionality & Goal are key. If the *Idea* and *End Goal* are the same as an existing project, BLOCK IT.
2. **Analysis Required**: In 'analysis_thought', you MUST list 3 Key Differences between the new and existing project. If you find 3 valid differences, it is OK.
3. **Domain & Innovation**: If the domain is different (e.g. Offline vs Cloud, Finance vs Health), it is a DIFFERENT IDEA -> OK.
4. **Ignore Tech Stack**: Using the same tools (AI, React, Firebase) does NOT make it the same idea. Ignore tech overlap.
5. **No Hallucinations**: You must be able to cite EXACT overlaps to match.
"""

        # Default fallback result
        result = {
            "originality_status": "OK",
            "most_similar_project": None,
            "suggested_features": None,
            "full_report": "AI analysis failed.",
            "relevance": 5,
            "feasibility": 5,
            "innovation": 5,
            "logical_fingerprint": new_fingerprint
        }

        ai_text = self._ask_ai_gemini_first(prompt, "Plagiarism Check", expect_json=True)
        json_data = self._extract_json(ai_text)

        if json_data:
            # Map JSON back to our internal result format
            p_status = json_data.get("plagiarism_status", "OK").upper()
            
            # Allow HF to override AI if it missed it (Safety Net)
            is_similar_semantic = hf_result["is_similar"] and hf_result["score"] > 0.70
            is_similar_literal = hf_result.get("literal_score", 0) > 0.40

            if (is_similar_semantic or is_similar_literal) and "BLOCKED" not in p_status:
                 logger.info("⚠️ AI missed similarity, but Math Layer caught it. Overriding to BLOCKED.")
                 p_status = "BLOCKED"
                 result["full_report"] = json_data.get("full_report", "") + f" (System Override: High { 'Semantic' if is_similar_semantic else 'Literal'} match detected despite AI approval)."

            result["originality_status"] = "BLOCKED_HIGH_SIMILARITY" if "BLOCKED" in p_status else "OK"
            
            result["relevance"] = int(json_data.get("relevance_score", 5))
            result["feasibility"] = int(json_data.get("feasibility_score", 5))
            result["innovation"] = int(json_data.get("innovation_score", 5))
            result["suggested_features"] = json_data.get("suggested_features")
            result["full_report"] = json_data.get("full_report", "Analysis completed.")
            result["logical_fingerprint"] = new_fingerprint

            # Handle similarity linking
            # Priority: HF Match > Gemini Match
            if hf_result["is_similar"]:
                 match = hf_result["most_similar_project"]
                 result["most_similar_project"] = {
                    "title": match.get("title") if isinstance(match, dict) else getattr(match, "title", ""),
                    "abstract_text": match.get("abstract_text") if isinstance(match, dict) else getattr(match, "abstract_text", ""),
                    "student": match.get("student__username") if isinstance(match, dict) else getattr(match, "student", "N/A")
                }
            else:
                idx = json_data.get("most_similar_project_index")
                if isinstance(idx, int) and 0 < idx <= len(existing_submissions):
                    match = existing_submissions[idx - 1]
                    result["most_similar_project"] = {
                        "title": match.get("title") if isinstance(match, dict) else getattr(match, "title", ""),
                        "abstract_text": match.get("abstract_text") if isinstance(match, dict) else getattr(match, "abstract_text", ""),
                        "student": match.get("student__username") if isinstance(match, dict) else getattr(match, "student", "N/A")
                    }
        
        return result

    # -----------------------
    # Embedding Generation
    # -----------------------
    def get_embedding(self, text):
        """
        Generates a vector embedding for the given text using Gemini.
        Returns a list of floats or None on failure.
        """
        if not text: 
            return None
            
        # Rotate keys if needed inside specific API calls isn't cleaner, 
        # but we can wrap this in a simple retry
        for _ in range(len(self.api_keys)):
            try:
                # text-embedding-004 is the latest stable model
                # text-embedding-004 is the latest stable model
                # New SDK Usage
                result = self.client.models.embed_content(
                    model="text-embedding-004",
                    contents=text
                )
                return result.embeddings[0].values
            except Exception as e:
                logger.warning(f"Embedding error: {e}. Rotating key...")
                self._rotate_key()
        
        return None

    # -----------------------
    # Viva: generation & evaluation
    # -----------------------
    def generate_viva_questions(self, title, abstract, progress_percentage, progress_history=None):
        history_text = "None"
        if progress_history and isinstance(progress_history, list):
            history_text = "\n- ".join(progress_history[:5]) # Limit to last 5 updates

        prompt = f"""
Generate 5 technical viva voce questions for:
Project: "{title}"
Abstract: "{abstract}"
Current Progress: {progress_percentage}%

Recent Progress Updates:
- {history_text}

Task:
Generate questions that verify the work mentioned in the Progress Updates and the Abstract.
If they say they implemented the database, ask about schema/normalization.
If they say they built the API, ask about endpoints/security.

Output ONLY a JSON list of strings:
["Question 1?", "Question 2?", ...]
"""
        ai_text = self._ask_ai_gemini_first(prompt, "Viva Generator", expect_json=True)
        questions = self._extract_json(ai_text)
        
        if isinstance(questions, list) and len(questions) > 0:
            return questions[:5]
            
        # Fallbacks
        return [
            "Can you explain the core architecture of your project?",
            "What were the major technical challenges you faced?",
            "How does your database schema support the features?",
            "What security measures have you implemented?",
            "How would you scale this application?"
        ]

    def evaluate_viva_answer(self, question, answer, abstract):
        prompt = f"""
Evaluate this viva answer.
Context (Abstract): "{abstract}"
Question: "{question}"
Student Answer: "{answer}"

Output JSON:
{{
    "score": <0-10>,
    "feedback": "<Concise, constructive feedback>"
}}
"""
        ai_text = self._ask_ai_gemini_first(prompt, "Viva Evaluator", expect_json=True)
        data = self._extract_json(ai_text)
        
        if data:
            return {
                "score": int(data.get("score", 5)), 
                "feedback": data.get("feedback", "Good attempt.")
            }
            
        return {"score": 5, "feedback": "AI evaluation unavailable. Answer recorded."}

    # -----------------------
    # Chatbot / Conversational
    # -----------------------
    # -----------------------
    # Chatbot / Conversational / Mentor
    # -----------------------
    def get_chat_response(self, prompt, context="", conversation_history=None):
        full_prompt = f"""
You are a helpful Project Guide Assistant.
Context Info:
{context}

User Query: {prompt}

Instructions:
1. If the project status is 'Completed', YOU CAN still discuss it, answer questions about its architecture, or help with future improvements.
2. If the user asks about the team, look at the Context Info.
3. Answer concisely and helpfuly.
"""
        # GLOBAL SAFETY NET: Truncate to ~24k chars to prevent Groq 413
        if len(full_prompt) > 24000:
             full_prompt = full_prompt[:24000] + "\n... (Truncated for AI Safety)"

        # Switch back to Groq First as requested to save Gemini quota
        response = self._ask_ai_with_fallback(full_prompt, "Chatbot")
        return response or "I'm currently experiencing high traffic. Please try again shortly."

    def get_mentor_chat_response(self, user_message, project_context, student_performance="", github_repo_link="", audit_report=None):
        """
        Specialized logic for the Project Mentor Chat.
        Fetches GitHub code if provided to enrich the context.
        """
        # Fetch repo content if link is provided (using local util)
        repo_content = ""
        
        if audit_report:
             # logger.info("Using cached Audit Report instead of cloning repo.")
             repo_content = f"*** PRE-GENERATED AUDIT REPORT (Database) ***\n{json.dumps(audit_report, indent=2)}\n(Raw code not loaded to save bandwidth)"
        else:
             repo_content = "(No pre-generated Audit Report found. Live GitHub cloning is disabled to conserve resources.)"

        prompt = f"""
        You are a friendly and technical "Project Mentor".

        [CONTEXT]
        Project Data: {project_context}
        Code Analysis: {repo_content}
        Student Stats: {student_performance}

        [USER QUESTION]
        "{user_message}"

        [TASK]
        Answer the student's question based on the [CONTEXT] above.
        - If the answer is in the Project Data or Code Analysis, cite it.
        - If the user asks "Who is in my team?", look for team members in the Project Data.
        - Be concise and helpful. Do not repeat these instructions.
        """
        
        # GLOBAL SAFETY NET: Truncate entire prompt to ~24k chars (~6k tokens) to prevent Groq 413
        # This is the "Nuclear Option" to ensure we never crash.
        if len(prompt) > 24000:
            # Keep the start (instructions/context) and the end (user message/output format)
            # Cut the middle to save tokens
            keep_start = 12000
            keep_end = 4000
            prompt = prompt[:keep_start] + "\n\n... [MIDDLE CONTEXT REMOVED FOR TOKEN SAFETY] ...\n\n" + prompt[-keep_end:]

        # We ask for JSON to ensure structured output, though raw text is also fine if we parse it.
        # reusing _ask_ai_with_fallback which handles Gemini -> Groq -> Ollama
        response_text = self._ask_ai_with_fallback(prompt, "Mentor Chat", expect_json=False)
        
        return {"mentor_response": response_text or "AI Service unavailable"}

    # -----------------------
    # Progress analysis
    # -----------------------
    def get_teacher_chat_response(self, user_message, project_context, github_repo_link="", audit_report=None):
        """
        Specialized logic for the Teacher Dashboard.
        1. Reads GitHub Code + Git Log (Audit Report)
           - OPTIMIZATION: If 'audit_report' is provided (from DB), use that instead of re-cloning!
        2. Analyzes Student Progress
        3. Answers Teacher's questions about the project.
        """
        # Fetch repo content if link is provided (AND no cached report available)
        repo_content = ""
        
        if audit_report:
             logger.info("Using cached Audit Report instead of cloning repo.")
             repo_content = f"*** PRE-GENERATED AUDIT REPORT (Database) ***\n{json.dumps(audit_report, indent=2)}\n(Raw code not loaded to save bandwidth)"
        elif github_repo_link:
            try:
                raw_code = clone_and_read_repo(github_repo_link)
                # Strict 12k char limit
                if len(raw_code) > 12000:
                    raw_code = raw_code[:12000] + "\n... (Repo Truncated)"
                    
                if raw_code and not raw_code.startswith("Error"):
                    repo_content = f"{raw_code}\n"
                else:
                    repo_content = f"(Could not fetch GitHub code: {raw_code})\n"
            except Exception as e:
                repo_content = f"(Error fetching repo: {e})"

        prompt = f"""
        Act as an intelligent "Teaching Assistant" analyzing a student project.
        
        === DATABASE RECORDS (Submitted Logs, Vivas) ===
        {project_context}
        
        === GITHUB REPOSITORY & AUDIT LOG (Live Code) ===
        (Source: {github_repo_link if github_repo_link else 'No Link'})
        {repo_content if repo_content else "No GitHub Content Available."}
        
        === TEACHER'S QUESTION ===
        "{user_message}"
        
        INSTRUCTIONS:
        1. **Analyze the Student's Work**: Compare the "DATABASE RECORDS" (what they claim) with the "GITHUB REPOSITORY" (what they actually coded).
        2. **STRICT RELEVANCE**: 
           - IF asked about "Viva", "Scores", or "Logs", answer ONLY based on the DATABASE RECORDS section. **DO NOT** mention the Audit Report or Code Quality unless specifically asked or if there is a massive contradiction (e.g., getting 10/10 viva but having no code).
           - IF asked about "Code", "Security", or "Audit", use the "GIT AUDIT LOG".
        3. **FORMATTING OPTIMIZATION**:
           - **ALWAYS use Markdown Tables** for lists of scores, viva results, or issues. (e.g., | Student | Score | Notes |).
           - **Be Concise**: Do not write long paragraphs. Use bullet points.
           - **No Preamble**: Start directly with the answer.
        4. **Be Objective**: If the code is missing but the logs say it's done, point out the discrepancy.
        
        OUTPUT FORMAT:
        Return the response in standard Markdown format. Do NOT use JSON.
        """
        
        # GLOBAL SAFETY NET
        if len(prompt) > 24000:
            prompt = prompt[:12000] + "\n\n... [MIDDLE CONTEXT REMOVED] ...\n\n" + prompt[-4000:]

        # Use the NEW Gemini-First method
        # expect_json=False because we now want raw markdown
        response_text = self._ask_ai_gemini_first(prompt, "Teacher Chat", expect_json=False)
        
        return response_text or "AI Service unavailable"

    def analyze_progress_update(self, project_abstract, update_text):
        prompt = f"""
Analyze this progress log for a software project.
Project Abstract: "{project_abstract}"
Log Entry: "{update_text}"

Estimate the TOTAL project completion percentage (0-100) based on standard SDLC phases (Requirements -> Design -> Dev -> Test -> Deploy).
Output ONLY JSON: {{ "percentage": <int> }}
"""
        ai_text = self._ask_ai_with_fallback(prompt, "Progress Analysis", expect_json=True)
        data = self._extract_json(ai_text)
        
        if data and "percentage" in data:
            return max(0, min(100, int(data["percentage"])))
            
        # Fallback logic if AI fails: simplistic keyword matching
        lower_text = update_text.lower()
        if "completed" in lower_text or "final" in lower_text: return 90
        if "testing" in lower_text: return 75
        if "implemented" in lower_text: return 50
        if "designed" in lower_text: return 30
        return 10

    # -----------------------
    # Resume, Tasks, PPT generators
    # -----------------------
    def generate_resume_points(self, title, abstract, tasks_text=""):
        prompt = f"""
Write 3 professional resume bullet points (STAR method) for:
Project: {title}
Tech Stack/Tasks: {tasks_text}

Output ONLY a JSON list of strings.
"""
        ai_text = self._ask_ai_with_fallback(prompt, "Resume Builder", expect_json=True)
        data = self._extract_json(ai_text)
        return data if isinstance(data, list) else ["Developed a full-stack application.", "Implemented robust API endpoints."]

    def generate_project_tasks(self, title, abstract):
        prompt = f"""
Create 8 technical Kanban tasks for: {title}
Output ONLY a JSON list of strings.
"""
        ai_text = self._ask_ai_with_fallback(prompt, "Task Generator", expect_json=True)
        data = self._extract_json(ai_text)
        return data if isinstance(data, list) else ["Setup Environment", "Design Database", "Implement API", "Build Frontend"]

    
    def analyze_image_artifact(self, image_path):
        try:
            img = PIL.Image.open(image_path)
            prompt = """
Analyze this project artifact.
1. Extract all visible text (OCR). If code, preserve formatting.
2. Generate 3-5 relevant technical tags.

Output JSON:
{
    "extracted_text": "...",
    "tags": ["tag1", "tag2"]
}
"""
            # Using the main model directly since fallback (Ollama) usually can't do image analysis well
            response = self.llm_model.generate_content([prompt, img])
            text = getattr(response, "text", str(response)).strip()
            data = self._extract_json(text)
            
            if data:
                return data
                
            return {"extracted_text": text, "tags": ["Image"]}
            
        except Exception as e:
            logger.error(f"Error analyzing image: {e}")
            return {"extracted_text": "AI Analysis Failed.", "tags": []}

    def grade_final_report(self, file_path):
        """
        Analyzes project documentation using Gemini's native PDF handling.
        """
        extracted_text = ""
        try:
            # Still try simple text extraction for database storage
            reader = pypdf.PdfReader(file_path)
            for page in reader.pages:
                extracted_text += (page.extract_text() or "") + "\n"
        except Exception:
            extracted_text = "Could not extract raw text."

        try:
            uploaded_file = genai.upload_file(file_path)
            
            # Wait for processing
            start_time = time.time()
            while uploaded_file.state.name == "PROCESSING":
                if time.time() - start_time > 20: # Timeout
                    raise TimeoutError("Gemini PDF processing timed out")
                time.sleep(1)
                uploaded_file = genai.get_file(uploaded_file.name)

            if uploaded_file.state.name == "FAILED":
                raise ValueError("Gemini failed to process PDF")

            prompt = """
You are a Senior Technical Lead. Review this Project Documentation PDF.
Output JSON:
{
    "feedback": "Detailed critique...",
    "scores": { "completeness": 0, "accuracy": 0, "presentation": 0 }
}
"""
            response = self.llm_model.generate_content([prompt, uploaded_file])
            data = self._extract_json(response.text)
            
            feedback = data.get("feedback", response.text) if data else response.text
            
            return {"feedback": feedback, "content": extracted_text[:50000]} # Truncate for DB limits
            
        except Exception as e:
            logger.error(f"Error analyzing PDF: {e}")
            return {"feedback": f"Analysis failed: {str(e)}", "content": extracted_text}

    # -----------------------
    # Audio transcription
    # -----------------------
    def transcribe_audio(self, audio_file_path):
        try:
            whisper_model = whisper.load_model("tiny")
            result = whisper_model.transcribe(audio_file_path)
            return result.get("text", "")
        except Exception as e:
            logger.error(f"Audio transcription error: {e}")
            return None

    # -----------------------
    # Misc
    # -----------------------

# Global Instance
analyzer = ProjectAnalyzer()