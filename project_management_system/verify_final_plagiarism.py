import os
import django
import json
import logging

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from project_management.project_analyzer import ProjectAnalyzer
from authentication.models import ProjectSubmission

# Configure Logger to capture AI output clearly
logger = logging.getLogger(__name__)

def verify_system():
    analyzer = ProjectAnalyzer()
    
    # Fetch existing data for context
    existing_submissions = list(ProjectSubmission.objects.all().values('abstract_text', 'title', 'student__username', 'logical_fingerprint'))
    
    print("\n=============================================")
    print("   FINAL PLAGIARISM SYSTEM VERIFICATION")
    print("=============================================\n")

    # --- TEST CASE 1: The "Offline AI" (Should PASS) ---
    print("Test 1: 'Offline Android AI' (Different Domain)")
    print("Expectation: PASS (Status 'OK')")
    
    title_1 = "Smart AI assistant designed specifically for Android devices"
    abstract_1 = """This project proposes a fully operational, smart AI assistant designed specifically for Android devices that functions entirely without an internet connection. It utilizes local Large Language Models (LLMs) and the high-performance llama.cpp library to process queries directly on the device. By leveraging optimized GGUF model files, it ensures 100% privacy and offline capability."""
    
    result_1 = analyzer.check_plagiarism_and_suggest_features(title_1, abstract_1, existing_submissions)
    
    status_1 = result_1.get('originality_status')
    score_1 = result_1.get('plagiarism_score')
    report_1 = result_1.get('full_report')
    
    if status_1 == "OK":
        print(f"Result: ✅ PASSED (Status: {status_1})")
    else:
        print(f"Result: ❌ FAILED (Status: {status_1})")
        print(f"Reason: {report_1}")

    print("-" * 40)

    # --- TEST CASE 2: The "Clone" (Should BLOCK) ---
    print("\nTest 2: 'AI College Project Manager' (Direct Clone)")
    print("Expectation: BLOCK (Status 'BLOCKED')")
    
    title_2 = "AI-Powered College Project Management System"
    abstract_2 = """The system addresses limits in traditional academic project management by using NLP and Generative AI. It automates plagiarism checks, scoring, and viva simulations using Google Gemini. It includes a dashboard for teachers and students."""
    
    result_2 = analyzer.check_plagiarism_and_suggest_features(title_2, abstract_2, existing_submissions)
    
    status_2 = result_2.get('originality_status')
    report_2 = result_2.get('full_report')
    
    if status_2 == "BLOCKED":
        print(f"Result: ✅ BLOCKED (Status: {status_2})")
        print(f"Block Reason: {report_2[:100]}...") # Show first 100 chars
    else:
        print(f"Result: ❌ FAILED (Status: {status_2})")
    
    print("\n=============================================")

if __name__ == "__main__":
    verify_system()
