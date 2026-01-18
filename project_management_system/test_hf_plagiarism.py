import os
import sys
import django
from unittest.mock import MagicMock, patch

# 1. Setup Django Environment
sys.path.append(r'c:\Users\nanda\avinash\project_management_system')
sys.path.append(r'c:\Users\nanda\avinash') # Add parent for project_management.settings resolution if needed
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from project_management.project_analyzer import ProjectAnalyzer
import logging

def test_offline_similarity():
    # Setup Custom Logger
    logger = logging.getLogger('OfflineTest')
    logger.setLevel(logging.INFO)
    
    # File Handler
    fh = logging.FileHandler(r'c:\Users\nanda\avinash\project_management_system\offline_test_output_v3.txt', mode='w', encoding='utf-8')
    formatter = logging.Formatter('%(message)s')
    fh.setFormatter(formatter)
    logger.addHandler(fh)
    
    logger.info("--- Offline Hugging Face Similarity Check ---")

    # DEBUG: Try loading model manually to see error
    try:
        from sentence_transformers import SentenceTransformer
        logger.info("Attempting to load SentenceTransformer manually...")
        model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("✅ Manual load success!")
    except Exception as e:
        logger.info(f"❌ Manual load failed: {e}")
        import traceback
        logger.info(traceback.format_exc())
    
    # 2. Initialize Analyzer
    with patch('google.generativeai.configure'):
        analyzer = ProjectAnalyzer()

    # 3. Mock Gemini
    analyzer._ask_ai_with_fallback = MagicMock(return_value='''
    {
        "plagiarism_status": "OK", 
        "full_report": "Gemini was bypassed. This report is from the mock.",
        "relevance_score": 0,
        "feasibility_score": 0,
        "innovation_score": 0,
        "suggested_features": "None"
    }
    ''')

    logger.info("✅ Gemini API has been mocked (disabled).")
    
    # 4. Define Test Data
    existing_submissions = [
        {
            'title': 'Smart Traffic Light',
            'abstract_text': 'A system that uses cameras to detect traffic density and adjust signal timings dynamically.',
            'student__username': 'student1'
        }
    ]
    
    new_title = "AI college project management system"
    new_abstract = "The AI-Based College Project Management System is a full-cycle platform that streamlines the lifecycle of student projects in higher education. It supports idea submission, AI-assisted evaluation, teacher review, progress tracking, viva preparation, and archiving. The system combines web frontends, a RESTful backend, an RDBMS, and ML/AI services that provide automated evaluations, summarization, plagiarism scanning, and recommendation features."

    logger.info(f"\nAnalyzing:\nTitle: {new_title}\nAbstract: {new_abstract}")
    logger.info(f"Against: {existing_submissions[0]['title']}")

    # 5. Run the check
    logger.info("\nRunning analysis (using local HF model)...")
    result = analyzer.check_plagiarism_and_suggest_features(new_title, new_abstract, existing_submissions)

    # 6. Verify Results
    if result.get('most_similar_project'):
        match_title = result['most_similar_project']['title']
        logger.info(f"\n🎉 SUCCESS: Hugging Face detected similarity locally!")
        logger.info(f"Matched with: {match_title}")
        
        if analyzer.similarity_model:
            emb1 = analyzer.similarity_model.encode(existing_submissions[0]['abstract_text'], convert_to_tensor=True)
            emb2 = analyzer.similarity_model.encode(new_abstract, convert_to_tensor=True)
            from sentence_transformers import util
            score = util.cos_sim(emb1, emb2).item()
            logger.info(f"Calculated Cosine Similarity Score: {score:.4f}")
    else:
        logger.info("\n❌ FAILURE: No similarity detected.")
        if analyzer.similarity_model:
                emb1 = analyzer.similarity_model.encode(existing_submissions[0]['abstract_text'], convert_to_tensor=True)
                emb2 = analyzer.similarity_model.encode(new_abstract, convert_to_tensor=True)
                from sentence_transformers import util
                score = util.cos_sim(emb1, emb2).item()
                logger.info(f"DEBUG: Actual Score was: {score:.4f}")
        else:
                logger.info("DEBUG: Model was None.")

test_offline_similarity()
