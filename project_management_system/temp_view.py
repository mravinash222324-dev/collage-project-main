class StudentMyProjectView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        # 1. Try to find a Project where the user is a team member
        project = Project.objects.filter(team__members=user).first()
        if project:
            return Response({
                "id": project.id,
                "title": project.title,
                "abstract_text": project.abstract,
                "github_link": project.github_repo_link,
                "status": project.status
            }, status=status.HTTP_200_OK)

        # 2. Fallback: Find the latest ProjectSubmission by the user
        submission = ProjectSubmission.objects.filter(student=user).order_by('-submitted_at').first()
        if submission:
            # Check if this submission has a related project (even if user isn't in team explicitly yet)
            if hasattr(submission, 'project'):
                 return Response({
                    "id": submission.project.id,
                    "title": submission.project.title,
                    "abstract_text": submission.project.abstract,
                    "github_link": submission.project.github_repo_link,
                    "status": submission.project.status
                }, status=status.HTTP_200_OK)
            
            return Response({
                "id": None, # No project ID yet
                "submission_id": submission.id,
                "title": submission.title,
                "abstract_text": submission.abstract_text,
                "github_link": None,
                "status": submission.status
            }, status=status.HTTP_200_OK)

        return Response({"detail": "No active project found."}, status=status.HTTP_404_NOT_FOUND)
