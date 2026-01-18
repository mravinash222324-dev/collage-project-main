import os
import django
import json
import logging

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from project_management.project_analyzer import ProjectAnalyzer
from authentication.models import ProjectSubmission

# Enable logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_report():
    analyzer = ProjectAnalyzer()
    
    # 1. The User's "Offline AI" Text
    new_title = "Smart AI assistant designed specifically for Android devices"
    new_abstract = """This project proposes a fully operational, smart AI assistant designed specifically for Android devices that functions entirely without an internet connection. It addresses the critical drawbacks of existing cloud-dependent AI systems, such as constant connectivity requirements and significant user data privacy concerns.

The proposed system utilizes local Large Language Models (LLMs) and the high-performance `llama.cpp` C++ inference library to process all queries directly on the device. By leveraging optimized GGUF (GGML) model files, the assistant ensures both enhanced privacy—as no data ever leaves the device—and significantly faster response times due to local processing.

Technically, the application features a robust architecture built upon a Kotlin frontend for the Android application logic and a high-performance C++ backend, connected via a JNI bridge, to handle core AI operations. This setup enables 100% offline capability, making advanced, intelligent services accessible in remote areas or scenarios where privacy is paramount, ushering in an era of high-performance, edge AI.

Tech Stack: Kotlin (Programming Language), C++ (Programming Language), llama.cpp C++ Library (Inference Engine), GGUF Model Format (Quantized LLM Format), JNI (Java Native Interface), Large Language Models (LLMs), Android (Platform). Tools: Android Studio IDE, CMake Setup"""

    # 2. Get All Existing projects to simulate real check
    # We want to see which one it matches against.
    existing_submissions = ProjectSubmission.objects.all().values('abstract_text', 'title', 'student__username', 'logical_fingerprint')
    
    print("--- RUNNING ANALYSIS ---")
    result = analyzer.check_plagiarism_and_suggest_features(
        new_title, new_abstract, list(existing_submissions)
    )

    # Write results to file to avoid console encoding issues
    with open('result_log.txt', 'w', encoding='utf-8') as f:
        f.write("--- ANALYSIS RESULT ---\n")
        f.write(f"Status: {result.get('originality_status')}\n")
        f.write(f"Most Similar Project: {result.get('most_similar_project')}\n")
        f.write(f"Plagiarism Score: {result.get('plagiarism_score')}\n")
        f.write(f"Full Report: {result.get('full_report')}\n")
        
        # Also verify if we can find the 'Project Management' submission in the DB to confirm ID
        pm_proj = ProjectSubmission.objects.filter(title__icontains="Project Management").first()
        if pm_proj:
            f.write(f"\n(Reference) Found 'Project Management' in DB with ID: {pm_proj.id}\n")
        else:
            f.write("\n(Reference) Could not find 'Project Management' in DB.\n")
    
    print("Check result_log.txt")

if __name__ == "__main__":
    get_report()
