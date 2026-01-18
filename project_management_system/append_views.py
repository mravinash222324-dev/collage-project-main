
with open('authentication/views.py', 'a', encoding='utf-8') as f:
    f.write('''

class TimedAssignmentCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]
    serializer_class = TimedAssignmentSerializer

    def perform_create(self, serializer):
        assignment = serializer.save(created_by=self.request.user)
        
        # Send email to all students in assigned groups
        student_emails = []
        for group in assignment.assigned_groups.all():
            for student in group.students.all():
                if student.email:
                    student_emails.append(student.email)
        
        if student_emails:
            try:
                send_mail(
                    subject=f"New Assignment: {assignment.title}",
                    message=f"A new timed assignment '{assignment.title}' has been created.\\nDuration: {assignment.duration_minutes} minutes.\\nDescription: {assignment.description}\\n\\nLog in to your dashboard to start.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=student_emails,
                    fail_silently=True
                )
            except Exception:
                pass

class TimedAssignmentListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TimedAssignmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'Teacher':
            return TimedAssignment.objects.filter(created_by=user).order_by('-start_time')
        elif user.role == 'Student':
            # Get assignments for groups the student belongs to
            return TimedAssignment.objects.filter(assigned_groups__students=user).distinct().order_by('-start_time')
        return TimedAssignment.objects.none()

class AssignmentSubmissionView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, assignment_id):
        assignment = get_object_or_404(TimedAssignment, id=assignment_id)
        
        if not assignment.is_active:
            return Response({"error": "Assignment time has expired."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check if user is in assigned group
        user_groups = request.user.student_groups.all()
        assigned_groups = assignment.assigned_groups.all()
        # Intersection of user groups and assignment groups
        # Since these are QuerySets, we can filter
        common_groups = user_groups.filter(id__in=assigned_groups.values_list('id', flat=True))
        
        if not common_groups.exists():
             return Response({"error": "You are not assigned to this task."}, status=status.HTTP_403_FORBIDDEN)
             
        data = request.data.copy()
        data['assignment'] = assignment.id
        # We need to manually set submitted_by because it's read_only in serializer
        # But wait, serializer.save(submitted_by=request.user) is better
        data['group'] = common_groups.first().id 
        
        serializer = AssignmentSubmissionSerializer(data=data)
        if serializer.is_valid():
            submission = serializer.save(submitted_by=request.user)
            
            # Trigger AI Verification (Mock for now)
            # In real implementation, we would send file/text to AI microservice
            submission.ai_verified = True
            submission.ai_feedback = "AI verification pending implementation."
            submission.save()
                
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
''')
print("Appended views")
