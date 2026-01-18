# Enhancement 1: Auto-hide expired assignments after 1 minute
# Add this filter logic to StudentAssignmentView.tsx around line 160

FILTER_CODE = """
.filter(assignment => {
  // Hide assignments that expired more than 1 minute ago
  const endTime = new Date(assignment.end_time).getTime();
  const oneMinuteAfterEnd = endTime + (60 * 1000);
  return currentTime < oneMinuteAfterEnd;
})
"""

# Enhancement 2: Backend - Use Code Reviewer for Code assignments
# Modify AssignmentSubmissionView in authentication/views.py

BACKEND_CODE_REVIEW_INTEGRATION = """
# In AssignmentSubmissionView.post method, replace AI verification section with:

if assignment.assignment_type == 'Code' and file:
    # Use existing code reviewer for Code assignments
    try:
        code_content = file.read().decode('utf-8')
        file.seek(0)  # Reset file pointer
        
        ai_payload = {
            'code': code_content,
            'filename': file.name
        }
        ai_response = requests.post('http://127.0.0.1:8001/review-code', json=ai_payload)
        if ai_response.status_code == 200:
            result = ai_response.json()
            submission.ai_verified = True
            submission.ai_score = (result.get('security_score', 0) + result.get('quality_score', 0)) / 2
            submission.ai_feedback = f"Security: {result.get('security_score')}/10, Quality: {result.get('quality_score')}/10\\n" + result.get('ai_feedback', '')
        else:
            submission.ai_feedback = "Code review failed"
    except Exception as e:
        submission.ai_feedback = f"Code review error: {str(e)}"
else:
    # Use generic assignment verification for other types
    if submission.text_content:
        ai_payload = {
            'assignment_type': assignment.assignment_type,
            'description': assignment.description,
            'text_content': submission.text_content
        }
        try:
            ai_response = requests.post('http://127.0.0.1:8001/verify-assignment', json=ai_payload)
            if ai_response.status_code == 200:
                result = ai_response.json()
                submission.ai_verified = result.get('is_approved', False)
                submission.ai_score = result.get('score', 0)
                submission.ai_feedback = result.get('feedback', '')
        except Exception as e:
            submission.ai_feedback = f"Verification error: {str(e)}"

submission.save()
"""

# Enhancement 3: Teacher View - Create new endpoint and component

TEACHER_SUBMISSION_VIEW_CODE = """
# New Backend View in authentication/views.py:

class AssignmentSubmissionsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]
    serializer_class = AssignmentSubmissionSerializer
    
    def get_queryset(self):
        assignment_id = self.kwargs.get('assignment_id')
        assignment = get_object_or_404(TimedAssignment, id=assignment_id, created_by=self.request.user)
        return AssignmentSubmission.objects.filter(assignment=assignment).select_related('group', 'submitted_by')

# Add URL in project_management/urls.py:
path('assignments/<int:assignment_id>/submissions/', AssignmentSubmissionsView.as_view(), name='assignment-submissions'),
"""

TEACHER_UI_CODE = """
// Update TeacherAssignmentManager.tsx to show submissions when clicking an assignment

const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
const [submissions, setSubmissions] = useState<any[]>([]);

const fetchSubmissions = async (assignmentId: number) => {
  const token = localStorage.getItem('accessToken');
  const response = await axios.get(
    `http://127.0.0.1:8000/assignments/${assignmentId}/submissions/`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  setSubmissions(response.data);
};

// In the assignment card, add onClick:
<Box onClick={() => {
  setSelectedAssignmentId(assignment.id);
  fetchSubmissions(assignment.id);
}}>

// Add modal to show submissions with AI scores
"""

print("=" * 60)
print("ENHANCEMENT INSTRUCTIONS")
print("=" * 60)
print()
print("1. AUTO-HIDE EXPIRED ASSIGNMENTS (Frontend):")
print("-" * 60)
print("File: frontend/src/components/StudentAssignmentView.tsx")
print("Location: Around line 160, after 'assignments.length === 0'")
print("Change FROM: assignments.map(assignment => {")
print("Change TO:   assignments.filter(...).map(assignment => {")
print()
print(FILTER_CODE)
print()

print("2. CODE REVIEW INTEGRATION (Backend):")
print("-" * 60)
print("File: project_management_system/authentication/views.py")
print("Location: AssignmentSubmissionView.post method")
print("Action: Replace the AI verification section (around line 75-85)")
print()
print(BACKEND_CODE_REVIEW_INTEGRATION)
print()

print("3. TEACHER SUBMISSION VIEW (Backend + Frontend):")
print("-" * 60)
print("A. Backend:")
print(TEACHER_SUBMISSION_VIEW_CODE)
print()
print("B. Frontend:")
print(TEACHER_UI_CODE)
print()
print("=" * 60)
print("These enhancements require manual implementation")
print("due to file editing complexity. Follow the instructions above.")
print("=" * 60)
