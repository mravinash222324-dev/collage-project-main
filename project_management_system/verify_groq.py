import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

try:
    from project_management.project_analyzer import ProjectAnalyzer
    print("Import successful")
    
    analyzer = ProjectAnalyzer()
    print(f"Analyzer initialized. APIs in pool: {len(analyzer.api_keys)}")
    
    if analyzer.groq_client:
        pool_size = len(getattr(analyzer, 'groq_keys', []))
        print(f"Groq Client Configured: YES")
        print(f"Key Pool Size: {pool_size}")
        
        print("Testing API Call (Mentor Chat)...")
        try:
            # Test the new mentor chat method directly
            response = analyzer.get_mentor_chat_response(
                "How do I optimize my database?", 
                "Project: E-Commerce", 
                "Performance: Good"
            )
            print(f"API Success: {response}")
        except Exception as api_e:
            print(f"API Failed: {api_e}")
    else:
        print("Groq Client Configured: NO")
        
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"Verification Failed: {e}")
