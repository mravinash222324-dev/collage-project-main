# authentication/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import JSONField 
from django.utils import timezone 
import datetime

class Group(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    teachers = models.ManyToManyField('User', related_name='teaching_groups', blank=True)
    students = models.ManyToManyField('User', related_name='student_groups', blank=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    ROLE_CHOICES = (
        ('Student', 'Student'),
        ('Teacher', 'Teacher'),
        ('HOD/Admin', 'HOD/Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='Student')

    def __str__(self):
        return self.username

class ProjectSubmission(models.Model):
    STATUS_CHOICES = (
        ('Submitted', 'Submitted'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Archived', 'Archived'),
    )
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    group = models.ForeignKey(Group, on_delete=models.SET_NULL, null=True, blank=True) 
    title = models.CharField(max_length=255)
    abstract_text = models.TextField()
    
    abstract_file = models.FileField(upload_to='project_abstracts/', null=True, blank=True)
    audio_file = models.FileField(upload_to='project_audio/', null=True, blank=True)
    
    transcribed_text = models.TextField(null=True, blank=True)
    
    # New AI analysis fields
    embedding = JSONField(null=True, blank=True)
    relevance_score = models.FloatField(null=True, blank=True)
    feasibility_score = models.FloatField(null=True, blank=True)
    innovation_score = models.FloatField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Submitted')

    submitted_at = models.DateTimeField(auto_now_add=True)
    tags = JSONField(null=True, blank=True) 
    ai_summary = models.TextField(null=True, blank=True)
    ai_similarity_report = JSONField(null=True, blank=True) 
    ai_suggested_features = models.TextField(null=True, blank=True)
    logical_fingerprint = JSONField(null=True, blank=True)
    
    def __str__(self):
        return f'{self.title} by {self.student.username}'

class Project(models.Model):
    STATUS_CHOICES = (
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Archived', 'Archived'),
    )
    CATEGORY_CHOICES = (
        ('Web Development', 'Web Development'),
        ('Mobile App', 'Mobile App'),
        ('Machine Learning', 'Machine Learning'),
        ('Cybersecurity', 'Cybersecurity'),
        ('IoT', 'IoT'),
        ('Other', 'Other'),
    )
    
    submission = models.OneToOneField(ProjectSubmission, on_delete=models.CASCADE, related_name='project')
    
    title = models.CharField(max_length=255)
    abstract = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Other')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='In Progress')
    final_report = models.FileField(upload_to='final_reports/', null=True, blank=True)
    ai_report_feedback = models.TextField(null=True, blank=True)
    final_report_content = models.TextField(null=True, blank=True)
    progress_percentage = models.IntegerField(default=0) 
    ai_resume_points = JSONField(null=True, blank=True)
    github_repo_link = models.URLField(blank=True, null=True)
    is_alumni = models.BooleanField(default=False)
    trend_score = models.FloatField(default=0.0)

    # Automated Audit Fields
    audit_security_score = models.IntegerField(default=0)
    audit_quality_score = models.IntegerField(default=0)
    audit_report = JSONField(null=True, blank=True)
    last_audit_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

class Team(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='team')
    members = models.ManyToManyField('User', related_name='active_projects')

    def __str__(self):
        return f'Team for {self.project.title}'

class Message(models.Model):
    TYPE_CHOICES = (
        ('GUIDE_GROUP', 'Guide Group'),
        ('TEAM_GROUP', 'Team Group'),
        ('DM', 'Direct Message'),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    message_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='GUIDE_GROUP')

    def __str__(self):
        return f'[{self.message_type}] {self.sender.username} -> {self.recipient.username}'

    class Meta:
        ordering = ['timestamp']

class VivaSession(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='viva_sessions')
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Viva for {self.project.title} by {self.student.username} at {self.created_at}"

class VivaQuestion(models.Model):
    session = models.ForeignKey(VivaSession, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    student_answer = models.TextField(blank=True, null=True)
    ai_score = models.IntegerField(null=True, blank=True)
    ai_feedback = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Q: {self.question_text[:30]}..."

# --- NEW MODELS FOR CHECKPOINTS AND CODE REVIEW ---

class Checkpoint(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='checkpoints')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    deadline = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    date_completed = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.title} - {self.project.title}"

class CodeReview(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='code_reviews')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='code_reviews')
    file_name = models.CharField(max_length=255)
    code_content = models.TextField() 
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # AI Feedback
    security_score = models.IntegerField(default=0) 
    quality_score = models.IntegerField(default=0) 
    security_issues = models.TextField(blank=True, null=True) 
    optimization_tips = models.TextField(blank=True, null=True) 
    ai_feedback = models.TextField(blank=True, null=True) 

    def __str__(self):
        return f"Review: {self.file_name} by {self.student.username}"

class ProgressUpdate(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='progress_updates')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress_updates')
    update_text = models.TextField()
    ai_suggested_percentage = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    sentiment = models.CharField(max_length=10, null=True, blank=True)
    
    # --- UPDATED FIELDS ---
    checkpoint = models.ForeignKey(Checkpoint, on_delete=models.SET_NULL, null=True, blank=True, related_name='updates')
    code_file = models.FileField(upload_to='progress_code/', null=True, blank=True)
    
    # New fields for Teacher Approval Workflow
    status = models.CharField(max_length=20, default='Pending', choices=[('Pending', 'Pending'), ('Approved', 'Approved'), ('Rejected', 'Rejected')])
    ai_analysis_result = JSONField(null=True, blank=True)

    def __str__(self):
        return f"Update for {self.project.title} ({self.ai_suggested_percentage}%) - {self.status}"
    
    class Meta:
        ordering = ['-created_at']

class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        return self.created_at >= timezone.now() - datetime.timedelta(minutes=10)

    def __str__(self):
        return f"OTP for {self.user.username}"

class ProjectArtifact(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='artifacts')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    image_file = models.ImageField(upload_to='project_artifacts/')
    description = models.CharField(max_length=255, blank=True)
    extracted_text = models.TextField(blank=True, null=True) 
    ai_tags = JSONField(blank=True, null=True) 

    def __str__(self):
        return f"Artifact for {self.project.title} ({self.uploaded_at.date()})"
    
class Task(models.Model):
    STATUS_CHOICES = (
        ('To Do', 'To Do'),
        ('In Progress', 'In Progress'),
        ('Done', 'Done'),
    )
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True) 
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='To Do')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.status})"
    
    class Meta:
        ordering = ['created_at']

class TypingStatus(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now=True) 

    def __str__(self):
        return f"{self.user.username} typing in {self.project.title}"

class TimedAssignment(models.Model):
    ASSIGNMENT_TYPES = (
        ('Code', 'Code'),
        ('Diagram', 'Diagram'),
        ('Report', 'Report'),
        ('Other', 'Other'),
    )
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    assignment_type = models.CharField(max_length=20, choices=ASSIGNMENT_TYPES, default='Other')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_assignments')
    assigned_groups = models.ManyToManyField(Group, related_name='assignments')
    
    start_time = models.DateTimeField(auto_now_add=True)
    duration_minutes = models.IntegerField()
    end_time = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.end_time:
            self.end_time = timezone.now() + datetime.timedelta(minutes=self.duration_minutes)
        super().save(*args, **kwargs)

    @property
    def is_active(self):
        return timezone.now() < self.end_time

    def __str__(self):
        return self.title

class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(TimedAssignment, on_delete=models.CASCADE, related_name='submissions')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='assignment_submissions')
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submitted_assignments')
    
    file = models.FileField(upload_to='assignment_submissions/', null=True, blank=True)
    text_content = models.TextField(null=True, blank=True)
    
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    ai_verified = models.BooleanField(default=False)
    ai_feedback = models.TextField(null=True, blank=True)
    ai_score = models.IntegerField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.assignment.title} - {self.group.name}"

class StudentActivityLog(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='student_activity_logs')
    action = models.CharField(max_length=255) # e.g., "Refactor Requested", "Code Copied"
    details = JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} - {self.action} - {self.timestamp}"
