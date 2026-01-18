# authentication/serializers.py
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer
from djoser.serializers import UserSerializer as BaseUserSerializer
from rest_framework import serializers
from django.utils import timezone
from .models import User, ProjectSubmission, Group, Project, Team, Message, VivaSession, VivaQuestion, ProgressUpdate, ProjectArtifact, Task, CodeReview, Checkpoint, TimedAssignment, AssignmentSubmission, StudentActivityLog
from django.db.models import JSONField


# User serializers
class UserCreateSerializer(BaseUserCreateSerializer):
    class Meta(BaseUserCreateSerializer.Meta):
        model = User
        fields = ('id', 'username', 'email', 'password', 'role')

class UserSerializer(BaseUserSerializer):
    class Meta(BaseUserSerializer.Meta):
        model = User
        fields = ('id', 'username', 'email', 'role', 'first_name', 'last_name') # 'role' field must be here
        read_only_fields = ('role',)

class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role')

# Main Project Submission serializer
class ProjectSubmissionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    group = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all())
    github_repo_link = serializers.SerializerMethodField()

    class Meta:
        model = ProjectSubmission
        fields = (
            'id', 'student', 'title', 'abstract_text', 'abstract_file', 
            'audio_file', 'transcribed_text', 'submitted_at', 'group', 
            'status', 
            'embedding', 'relevance_score', 'feasibility_score', 
            'innovation_score', 'tags', 'ai_summary',
            'ai_similarity_report', 'ai_suggested_features',
            'github_repo_link'
        )
        read_only_fields = (
            'student', 'submitted_at', 'transcribed_text',
            'embedding', 'relevance_score', 'feasibility_score', 
            'innovation_score', 'tags', 'ai_summary',
            'ai_similarity_report', 'ai_suggested_features'
        )

    def validate_abstract_text(self, value):
        word_count = len(value.strip().split())
        if word_count < 50:
            raise serializers.ValidationError(f"Abstract is too short ({word_count} words). Minimum 50 words required for AI validation.")
        return value

    def create(self, validated_data):
        student = validated_data.pop('student')
        embedding = validated_data.pop('embedding', None)
        relevance_score = validated_data.pop('relevance_score', 0.0)
        feasibility_score = validated_data.pop('feasibility_score', 0.0)
        innovation_score = validated_data.pop('innovation_score', 0.0)
        tags = validated_data.pop('tags', None)
        ai_summary = validated_data.pop('ai_summary', None)
        ai_similarity_report = validated_data.pop('ai_similarity_report', None)
        ai_suggested_features = validated_data.pop('ai_suggested_features', None)
        transcribed_text = validated_data.pop('transcribed_text', None) 
        
        instance = ProjectSubmission.objects.create(student=student, **validated_data)
        
        instance.embedding = embedding
        instance.relevance_score = relevance_score
        instance.feasibility_score = feasibility_score
        instance.innovation_score = innovation_score
        instance.tags = tags
        instance.ai_summary = ai_summary
        instance.ai_similarity_report = ai_similarity_report
        instance.ai_suggested_features = ai_suggested_features
        instance.transcribed_text = transcribed_text
        
        instance.save()

        if instance.group:
            instance.group.students.add(student)

        return instance

    def get_github_repo_link(self, obj):
        try:
            if hasattr(obj, 'project') and obj.project:
                return obj.project.github_repo_link
        except Exception:
            return None
        return None

# Serializer for the teacher dashboard (read-only)
class TeacherSubmissionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    project_id = serializers.SerializerMethodField()
    audit_security_score = serializers.IntegerField(source='project.audit_security_score', read_only=True, allow_null=True)
    audit_quality_score = serializers.IntegerField(source='project.audit_quality_score', read_only=True, allow_null=True)
    audit_report = serializers.JSONField(source='project.audit_report', read_only=True, allow_null=True)

    class Meta:
        model = ProjectSubmission
        fields = (
            'id', 'student', 'group', 'group_name', 'title', 'abstract_text',
            'relevance_score', 'feasibility_score', 'innovation_score',
            'status', 'project_id', 'tags', 'ai_summary', 'ai_similarity_report', 
            'ai_suggested_features', 'audit_security_score', 'audit_quality_score', 
            'audit_report', 'abstract_file'
        )
        read_only_fields = (
            'id', 'student', 'group', 'group_name', 'status', 'project_id',
            'relevance_score', 'feasibility_score', 'innovation_score',
            'abstract_text', 'title', 'tags', 'ai_summary', 'ai_similarity_report', 
            'ai_suggested_features', 'audit_security_score', 'audit_quality_score', 'audit_report'
        )

    def get_project_id(self, obj):
        try:
            if hasattr(obj, 'project') and obj.project:
                return obj.project.id
        except:
             return None
        return None

class ProjectSerializer(serializers.ModelSerializer):
    submission = ProjectSubmissionSerializer(read_only=True)
    team = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Project
        fields = (
            'id', 'title', 'abstract', 'category', 'status', 'final_report', 
            'submission', 'team', 'github_repo_link',
            'audit_security_score', 'audit_quality_score', 'audit_report', 'last_audit_date'
        )
        read_only_fields = (
            'submission', 'team',
            'audit_security_score', 'audit_quality_score', 'audit_report', 'last_audit_date'
        )

class GroupSerializer(serializers.ModelSerializer):
    teachers = UserSerializer(many=True, read_only=True)
    students = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Group
        fields = ('id', 'name', 'description', 'teachers', 'students')

class SimilarProjectSerializer(serializers.Serializer):
    title = serializers.CharField()
    student = serializers.CharField()
    abstract_text = serializers.CharField()

class ApprovedProjectSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='submission.student.username', read_only=True)
    submission_id = serializers.IntegerField(source='submission.id', read_only=True)
    abstract_text = serializers.CharField(source='submission.abstract_text', read_only=True)
    team_members = serializers.SerializerMethodField()
    member_stats = serializers.SerializerMethodField()
    relevance_score = serializers.FloatField(source='submission.relevance_score', read_only=True)
    feasibility_score = serializers.FloatField(source='submission.feasibility_score', read_only=True)
    innovation_score = serializers.FloatField(source='submission.innovation_score', read_only=True)
    group_name = serializers.CharField(source='submission.group.name', read_only=True)
    teachers = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            'id', 'submission_id', 'title', 'abstract_text', 'student_name', 
            'group_name',
            'status', 'progress_percentage', 'category', 'final_report',
            'ai_report_feedback', 'team_members', 'member_stats',
            'relevance_score', 'feasibility_score', 'innovation_score',
            'audit_security_score', 'audit_quality_score', 'audit_report', 'last_audit_date',
            'teachers'
        )

    def get_teachers(self, obj):
        try:
            if obj.submission.group:
                return [t.username for t in obj.submission.group.teachers.all()]
        except:
            pass
        return []

    def get_team_members(self, obj):
        try:
            members = list(obj.team.members.all())
            return SimpleUserSerializer(members, many=True).data
        except:
            if obj.submission.group:
                 members = list(obj.submission.group.students.all())
                 return SimpleUserSerializer(members, many=True).data
            return []

    def get_member_stats(self, obj):
        stats = []
        members = []
        if hasattr(obj, 'team'):
            members = list(obj.team.members.all())
        
        if not members and obj.submission.student:
            members = [obj.submission.student]

        for member in members:
            updates_count = ProgressUpdate.objects.filter(project=obj, author=member).count()
            reviews_count = CodeReview.objects.filter(project=obj, student=member).count()
            viva_sessions = VivaSession.objects.filter(project=obj, student=member)
            avg_viva = 0
            if viva_sessions.exists():
                total_score = 0
                count = 0
                for vs in viva_sessions:
                    for q in vs.questions.all():
                        if q.ai_score is not None:
                             total_score += q.ai_score
                             count += 1
                if count > 0:
                    avg_viva = round(total_score / count, 1)

            stats.append({
                "student_id": member.id,
                "username": member.username,
                "updates_count": updates_count,
                "reviews_count": reviews_count,
                "viva_average": avg_viva
            })
        return stats

class StudentSubmissionSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.name', read_only=True)
    progress = serializers.IntegerField(source='project.progress_percentage', read_only=True, allow_null=True)
    project_id = serializers.IntegerField(source='project.id', read_only=True, allow_null=True)
    abstract = serializers.CharField(source='abstract_text', read_only=True)
    final_report = serializers.SerializerMethodField()
    ai_report_feedback = serializers.SerializerMethodField()
    ai_resume_points = serializers.SerializerMethodField()
    team_members = serializers.SerializerMethodField()
    github_repo_link = serializers.CharField(source='project.github_repo_link', read_only=True, allow_null=True)
    audit_security_score = serializers.IntegerField(source='project.audit_security_score', read_only=True, allow_null=True)
    audit_quality_score = serializers.IntegerField(source='project.audit_quality_score', read_only=True, allow_null=True)
    audit_report = serializers.JSONField(source='project.audit_report', read_only=True, allow_null=True)
    last_audit_date = serializers.DateTimeField(source='project.last_audit_date', read_only=True, allow_null=True)

    class Meta:
        model = ProjectSubmission
        fields = (
            'id', 'group_name', 'title', 'abstract', 'status', 'progress',
            'project_id','ai_similarity_report', 'ai_suggested_features' ,'final_report',
            'ai_report_feedback','ai_resume_points','team_members',
            'relevance_score', 'feasibility_score', 'innovation_score',
            'github_repo_link', 'audit_security_score', 'audit_quality_score', 
            'audit_report', 'last_audit_date'
        )
        read_only_fields = (
            'id', 'group_name', 'title', 'status', 'progress', 'project_id',
            'relevance_score', 'feasibility_score', 'innovation_score',
            'github_repo_link', 'audit_security_score', 'audit_quality_score', 
            'audit_report', 'last_audit_date'
        )

    def get_team_members(self, obj):
        members = []
        # 1. Get students from Project Team if it exists
        if hasattr(obj, 'project') and hasattr(obj.project, 'team'):
            members = list(obj.project.team.members.all())
        # 2. Fallback to students from Group if no Team is found
        elif obj.group:
            members = list(obj.group.students.all())
            
        # 3. ALWAYS add teachers from the group so students can DM them
        if obj.group:
            members += list(obj.group.teachers.all())
            
        # Deduplicate by ID
        seen = set()
        unique_members = []
        for m in members:
            if m.id not in seen:
                unique_members.append(m)
                seen.add(m.id)
                
        return SimpleUserSerializer(unique_members, many=True).data
    
    def get_related_project(self, obj):
        if hasattr(obj, 'project'):
            return obj.project
        return None

    def get_progress(self, obj):
        project = self.get_related_project(obj)
        return project.progress_percentage if project else 0

    def get_project_id(self, obj):
        project = self.get_related_project(obj)
        return project.id if project else None

    def get_final_report(self, obj):
        project = self.get_related_project(obj)
        if project and project.final_report:
            return project.final_report.url
        return None

    def get_ai_report_feedback(self, obj):
        project = self.get_related_project(obj)
        return project.ai_report_feedback if project else None
    
    def get_ai_resume_points(self, obj):
        project = self.get_related_project(obj)
        return project.ai_resume_points if project else None

class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)

    class Meta:
        model = Message
        fields = (
            'id', 'project', 'sender', 'sender_username', 'recipient', 
            'recipient_username', 'content', 'timestamp', 'is_read','message_type'
        )
        read_only_fields = (
            'id', 'project', 'sender', 'recipient', 'timestamp', 
            'sender_username', 'recipient_username', 'is_read'
        )

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)

class VivaQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VivaQuestion
        fields = ['id', 'question_text', 'student_answer', 'ai_score', 'ai_feedback']
        read_only_fields = ['question_text', 'ai_score', 'ai_feedback']

class VivaSessionSerializer(serializers.ModelSerializer):
    questions = VivaQuestionSerializer(many=True, read_only=True)
    title = serializers.CharField(source='project.title', read_only=True)
    student_name = serializers.CharField(source='student.username', read_only=True)
    
    class Meta:
        model = VivaSession
        fields = ['id', 'title', 'student_name', 'questions', 'created_at']

class ProgressUpdateSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    checkpoint_title = serializers.CharField(source='checkpoint.title', read_only=True)

    class Meta:
        model = ProgressUpdate
        fields = (
            'id', 'project', 'author', 'author_username', 
            'update_text', 'ai_suggested_percentage', 
            'created_at', 'sentiment', 'checkpoint', 
            'checkpoint_title', 'code_file',
            'status', 'ai_analysis_result'
        )
        read_only_fields = (
            'id', 'author', 'ai_suggested_percentage', 
            'created_at', 'sentiment', 'checkpoint_title',
            'status', 'ai_analysis_result'
        )

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)

class ProjectArtifactSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectArtifact
        fields = ('id', 'project', 'image_file', 'description', 'extracted_text', 'ai_tags', 'uploaded_at')
        read_only_fields = ('project', 'extracted_text', 'ai_tags', 'uploaded_at')

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'title', 'status', 'description']

class CodeReviewSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    
    class Meta:
        model = CodeReview
        fields = (
            'id', 'project', 'student', 'student_username', 'file_name', 
            'code_content', 'uploaded_at', 
            'security_score', 'quality_score', 
            'security_issues', 'optimization_tips', 'ai_feedback'
        )
        read_only_fields = (
            'id', 'student', 'uploaded_at', 
            'security_score', 'quality_score', 
            'security_issues', 'optimization_tips', 'ai_feedback'
        )

class CheckpointSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = Checkpoint
        fields = ('id', 'project', 'title', 'description', 'deadline', 'is_completed', 'date_completed', 'status')
        read_only_fields = ('id', 'status')

    def get_status(self, obj):
        if obj.is_completed:
            return 'Completed'
        latest = obj.updates.order_by('-created_at').first()
        if latest:
            if latest.status == 'Pending':
                return 'Pending Approval'
            if latest.status == 'Rejected':
                return 'Rejected'
        return 'Incomplete'

class TimedAssignmentSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(read_only=True)
    time_remaining = serializers.SerializerMethodField()
    is_submitted = serializers.SerializerMethodField()

    def __init__(self, *args, **kwargs):
        super(TimedAssignmentSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if request.user.role == 'Teacher':
                self.fields['assigned_groups'].queryset = request.user.teaching_groups.all()

    class Meta:
        model = TimedAssignment
        fields = '__all__'
        read_only_fields = ('created_by', 'start_time', 'end_time')

    def get_time_remaining(self, obj):
        if not obj.is_active:
            return 0
        remaining = obj.end_time - timezone.now()
        return max(0, int(remaining.total_seconds()))

    def get_is_submitted(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            return AssignmentSubmission.objects.filter(assignment=obj, submitted_by=user).exists()
        return False

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    submitted_by_username = serializers.CharField(source='submitted_by.username', read_only=True)
    
    class Meta:
        model = AssignmentSubmission
        fields = '__all__'
        read_only_fields = ('submitted_by', 'submitted_at', 'ai_verified', 'ai_feedback', 'ai_score')

class AlumniProjectSerializer(serializers.ModelSerializer):
    student = UserSerializer(source='submission.student', read_only=True)
    innovation_score = serializers.FloatField(source='submission.innovation_score', read_only=True)
    relevance_score = serializers.FloatField(source='submission.relevance_score', read_only=True)
    abstract_text = serializers.CharField(source='submission.abstract_text', read_only=True)
    submitted_at = serializers.DateTimeField(source='submission.submitted_at', read_only=True)

    class Meta:
        model = Project
        fields = (
            'id', 'title', 'abstract', 'category', 'status', 
            'student', 'innovation_score', 'relevance_score', 
            'abstract_text', 'submitted_at',
            'github_repo_link', 'final_report'
        )

class StudentActivityLogSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = StudentActivityLog
        fields = ('id', 'student', 'student_username', 'project', 'project_title', 'action', 'details', 'timestamp')
        read_only_fields = ('id', 'student', 'timestamp')
