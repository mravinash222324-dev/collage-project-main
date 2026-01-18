import logging
import sys

# Setup simple logging
logging.basicConfig(stream=sys.stdout, level=logging.INFO, format='%(message)s')

def run_tests():
    try:
        from sentence_transformers import SentenceTransformer, util
    except ImportError as e:
        print(f"ERROR: Could not import sentence_transformers: {e}")
        return

    print("Loading Model...")
    try:
        model = SentenceTransformer('all-MiniLM-L6-v2')
    except Exception as e:
        print(f"ERROR: Model load failed: {e}")
        return
    
    # Base Project
    base_project = {
        "title": "AI-Powered College Project Management System",
        "abstract": """This project details the development of the "AI-Powered College Project Management System," an innovative, centralized platform designed to overhaul traditional, manual academic project supervision processes. The existing system suffers from critical inefficiencies, including reliance on paper or email submissions, inconsistent manual plagiarism checks, lack of centralized progress tracking, and synchronous, time-consuming viva sessions. The proposed solution implements a decoupled, role-based architecture managing the entire project lifecycle, from submission to archiving. Key functionality relies heavily on Intelligent Automation: automated AI Submission Analyzers conduct mandatory plagiarism checks and generate standardized quality scores (evaluating Relevance, Feasibility, and Innovation). A unique feature is the Persistent AI Viva simulation, which uses Generative AI (Google Gemini) to conduct on-demand, adaptive verbal examinations, logging all interactions, scores, and faculty feedback.

Technologically, the system utilizes a decoupled REST API architecture, with the backend built using Python, Django, and Django REST Framework, while the frontend is a modern Single-Page Application (SPA) developed with React.js and TypeScript. Natural Language Processing capabilities, including embeddings via Sentence Transformers and the use of Retrieval-Augmented Generation (RAG), enable a Context-Aware AI Assistant to provide faculty and administrative staff with intelligent, data-backed answers based on the project database context. Audio transcription for file uploads is handled using Whisper."""
    }

    test_cases = [
        {
            "type": "DISTINCT",
            "expected": "PASS",
            "title": "Online Shoe Store",
            "abstract": "A MERN stack e-commerce application for selling shoes. Features include user authentication, product catalog, shopping cart, and payment gateway. Admin panel for managing inventory."
        },
        {
            "type": "SIMILAR TECH",
            "expected": "PASS",
            "title": "AI Healthcare Assistant",
            "abstract": "An AI-powered diagnostic tool helping doctors analyze patient symptoms. Uses Python, Django, and Machine Learning models to predict diseases based on input parameters. Features a React frontend."
        },
        {
            "type": "PLAGIARIZED",
            "expected": "FAIL",
            "title": "Student Project Tracker",
            "abstract": "A centralized system to manage college projects, replacing manual email submissions. Uses a Python backend and React frontend. Includes AI features to check for plagiarism and automatically grade submissions. Teachers can track progress."
        },
        {
            "type": "SUBTLE",
            "expected": "PASS",
            "title": "Manual Project File Manager",
            "abstract": "A simple PHP-based file management system for students to upload project zips. Teachers can download files and manually grade them. No AI features included. Focuses on simple storage and retrieval."
        },
        {
            "type": "BOUNDARY (Same Genre)",
            "expected": "PASS (Should be ~0.4-0.6)",
            "title": "Library Management System",
            "abstract": "A centralized platform for managing college library books. Features include checking out books, tracking due dates, and an admin panel for librarians to add new inventory. Uses Python and SQL to manage the database of students and books."
        },
        {
            "type": "USER REPORTED (Short/Generic)",
            "expected": "PASS (Too vague to be plagiarism)",
            "title": "User's Short Query",
            "abstract": "ai platform which having a to z of controlling a lifetime of a college project in an accadamic year including student teacher intreaction about the project"
        }
    ]

    print(f"\nBASE PROJECT: {base_project['title']}\n")
    print("TYPE                           | SCORE    | RESULT     | EXPECTED")
    print("-" * 75)

    try:
        base_emb = model.encode(base_project['abstract'], convert_to_tensor=True, show_progress_bar=False)
    except Exception as e:
        # Fallback for older sentence-transformers versions that might not support show_progress_bar
        base_emb = model.encode(base_project['abstract'], convert_to_tensor=True)


    for case in test_cases:
        try:
             case_emb = model.encode(case['abstract'], convert_to_tensor=True, show_progress_bar=False)
        except:
             case_emb = model.encode(case['abstract'], convert_to_tensor=True)
             
        score = util.cos_sim(base_emb, case_emb).item()
        
        # Threshold from our fix
        status = "FLAGGED" if score > 0.75 else "OK"
        
        print(f"{case['type']:<30} | {score:.4f}   | {status:<10} | {case['expected']}")

if __name__ == "__main__":
    run_tests()
