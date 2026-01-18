from django.core.management.base import BaseCommand
from project_management.project_analyzer import ProjectAnalyzer
from authentication.models import ProjectSubmission

class Command(BaseCommand):
    help = 'Verify plagiarism detection logic against real database'

    def add_arguments(self, parser):
        parser.add_argument('--title', type=str, help='Title of the new project')
        parser.add_argument('--abstract', type=str, help='Abstract of the new project')

    def handle(self, *args, **kwargs):
        analyzer = ProjectAnalyzer()
        
        self.stdout.write("--- Plagiarism Detection Verification ---")

        # 1. Get Input
        title = kwargs.get('title')
        abstract = kwargs.get('abstract')

        if not title:
            title = input("Enter Project Title: ")
        if not abstract:
            abstract = input("Enter Project Abstract: ")

        self.stdout.write(f"\nAnalyzing:\nTitle: {title}\nAbstract: {abstract}\n")

        # 2. Fetch Real Data
        existing_submissions = list(ProjectSubmission.objects.all())
        count = len(existing_submissions)
        self.stdout.write(f"Checking against {count} existing submissions in database...")

        if count == 0:
            self.stdout.write(self.style.WARNING("Warning: Database is empty. Plagiarism check will likely pass."))

        # 3. Run the check
        result = analyzer.check_plagiarism_and_suggest_features(title, abstract, existing_submissions)
        
        # 4. Display Results
        self.stdout.write("\n--- Analysis Result ---")
        
        status = result.get('originality_status')
        if status == 'BLOCKED_HIGH_SIMILARITY':
            self.stdout.write(self.style.ERROR(f"Originality Status: {status}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Originality Status: {status}"))
            
        self.stdout.write(f"Full Report: {result.get('full_report')}")
        
        if result.get('most_similar_project'):
            match = result['most_similar_project']
            match_title = match.get('title')
            self.stdout.write(self.style.WARNING(f"Most Similar Project: {match_title}"))
