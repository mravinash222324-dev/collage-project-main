from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import StudentXP, XPLog

from .serializers import StudentXPSerializer, LeaderboardSerializer
from authentication.models import Project, Checkpoint, Task

from django.db.models import Q
from datetime import datetime


class LeaderboardView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LeaderboardSerializer

    def get_queryset(self):
        # Return top 50 students ordered by total_xp
        return StudentXP.objects.select_related('student').order_by('-total_xp')[:50]

class StudentStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        # Ensure XP profile exists
        xp_profile, created = StudentXP.objects.get_or_create(student=user)
        
        serializer = StudentXPSerializer(xp_profile)
        return Response(serializer.data)

class AvatarUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        user = request.user
        xp_profile, _ = StudentXP.objects.get_or_create(student=user)
        
        style = request.data.get('avatar_style')
        seed = request.data.get('avatar_seed')
        
        if style:
            xp_profile.avatar_style = style
        if seed:
            xp_profile.avatar_seed = seed
            
        xp_profile.save()
        
        return Response({
            'message': 'Avatar updated successfully',
            'avatar_style': xp_profile.avatar_style,
            'avatar_seed': xp_profile.avatar_seed
        })

class ProjectTimeCapsuleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        # Get the user's active project
        try:
            # Assuming one active project for now, or get the latest
            project = Project.objects.filter(
                Q(team__members=user) | Q(submission__student=user)
            ).distinct().first()
            
            if not project:
                return Response({"events": []})

            events = []

            # 1. Project Start
            events.append({
                "id": f"start-{project.id}",
                "date": project.submission.submitted_at,
                "title": "Project Inception",
                "description": f"Started working on {project.title}",
                "type": "START",
                "icon": "Rocket"
            })

            # 2. Checkpoints
            checkpoints = Checkpoint.objects.filter(project=project, is_completed=True)
            for cp in checkpoints:
                if cp.date_completed:
                    events.append({
                        "id": f"cp-{cp.id}",
                        "date": cp.date_completed,
                        "title": f"Milestone: {cp.title}",
                        "description": cp.description,
                        "type": "CHECKPOINT",
                        "icon": "Flag"
                    })

            # 3. Tasks Completed
            tasks = Task.objects.filter(project=project, status='Done')
            for task in tasks:
                events.append({
                    "id": f"task-{task.id}",
                    "date": task.created_at, # Using created_at as completion time isn't always tracked explicitly in simple models, or we could add updated_at
                    "title": "Task Conquered",
                    "description": task.title,
                    "type": "TASK",
                    "icon": "CheckCircle"
                })

            # 4. XP Gains (Significant ones)
            xp_logs = XPLog.objects.filter(student=user, amount__gte=50) # Only show big wins
            for log in xp_logs:
                events.append({
                    "id": f"xp-{log.id}",
                    "date": log.created_at,
                    "title": "Level Up Moment",
                    "description": f"Gained {log.amount} XP: {log.description}",
                    "type": "ACHIEVEMENT",
                    "icon": "Trophy"
                })

            # Sort by date
            events.sort(key=lambda x: x['date'])

            return Response({"events": events})

        except Exception as e:
            return Response({"error": str(e)}, status=500)
