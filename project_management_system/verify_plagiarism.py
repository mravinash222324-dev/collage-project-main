import sys
import os
import django

# Setup Django environment
# We are running from 'avinash' root
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management_system.settings')
django.setup()

from project_management.project_analyzer import ProjectAnalyzer

def test_plagiarism_check():
    analyzer = ProjectAnalyzer()
    
    print("--- Plagiarism Detection Verification ---")
    
    # 1. Simulate an existing project in the database
    # We use a dictionary to simulate the object structure expected by the analyzer
    existing_project = {
        'title': 'Smart Traffic Light System',
        'abstract_text': 'A system that uses cameras to detect traffic density and adjust signal timings dynamically to reduce congestion and improve traffic flow.',
        'student__username': 'student_A'
    }
    
    existing_submissions = [existing_project]
    print(f"\n[Existing Project]\nTitle: {existing_project['title']}\nAbstract: {existing_project['abstract_text']}")

    # 2. Simulate a NEW submission that is semantically similar (different words, same meaning)
    new_title = "AI-Based college project managmentemnt system"
    new_abstract = "The AI-Based College Project Management System is a full-cycle platform that streamlines the lifecycle of student projects in higher education. It supports idea submission, AI-assisted evaluation, teacher review, progress tracking, viva preparation, and archiving. The system combines web frontends, a RESTful backend, an RDBMS, and ML/AI services that provide automated evaluations, summarization, plagiarism scanning, and recommendation features.."
    
    print(f"\n[New Submission]\nTitle: {new_title}\nAbstract: {new_abstract}")

    print("\nRunning analysis...")
    
    # 3. Run the check
    result = analyzer.check_plagiarism_and_suggest_features(new_title, new_abstract, existing_submissions)
    
    # 4. Display Results
    print("\n--- Analysis Result ---")
    print(f"Originality Status: {result.get('originality_status')}")
    print(f"Full Report: {result.get('full_report')}")
    
    if result.get('most_similar_project'):
        print(f"Most Similar Project: {result['most_similar_project']['title']}")
    
    # Check if our internal HF check worked (it's part of the logic now)
    # We can't easily access the internal variable 'hf_result' from here, 
    # but the 'originality_status' being BLOCKED or the report mentioning it confirms it.

if __name__ == "__main__":
    test_plagiarism_check()
