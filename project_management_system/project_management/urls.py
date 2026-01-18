# project_management/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from .mentor_views import ProjectMentorChatView, MCPToolView, ProjectMentorChatMCPView, AIVivaMCPView, TeacherChatMCPView
from authentication.views import (
    ProjectSubmissionView,
    TeacherDashboardView,
    StudentDashboardView,
    AIChatbotView,
    AIVivaView,
    AIVivaEvaluationView,
    ProjectArchiveView,
    AnalyticsView,
    LeaderboardView,
    AlumniPortalView,
    AllProjectsView,
    AdminDashboardView,
    AppointedTeacherDashboard,
    UnappointedTeacherDashboard,
    ProjectLogUpdateView,
    ProjectProgressLogListView,
    ProjectProgressView,
    TopAlumniProjectsView,
    ApprovedProjectsView,
    ProjectMessagesView,
    ProjectVivaListView,
    ProjectInquiryView,
    AdminGroupManagementView, 
    AdminUserRoleView,
    RequestPasswordResetView, # <-- Add this
    ResetPasswordView,
    ProjectArtifactUploadView, # <-- ADD
    ProjectArtifactListView,
    ProjectReportUploadView, # <-- Add
    ProjectReportGradeView,
    ProjectTaskManagerView, # <-- Add
    TaskUpdateView,
    ProjectResumeView,
    MarkMessagesReadView,
    TypingUpdateView,
    CodeReviewView,
    CheckpointListView,
    CheckpointGenerationView,
    CheckpointVerificationView,
    TimedAssignmentCreateView,
    TimedAssignmentListView,
    AssignmentSubmissionView,
    TeacherGroupListView,
    AssignmentSubmissionsListView,
    TeacherDashboardStatsView,
    TeacherActivityFeedView,
    StudentActivityFeedView,
    ProjectUpdateView, 

    ProjectAuditView, # <-- ADD
    ProjectDocsView, # <-- NEW

    ProjectIssuesView, # <-- NEW

    ProjectAutoFixView, # <-- NEW (PR Agent)
    ProjectChatCodebaseView, # <-- NEW (RAG)
    TeamMemberView, # <-- ADD
    StudentMyProjectView, 
    ProgressUpdateDecisionView, # <-- ADD
    ProjectExtractionView, # <-- ADD
    AlumniProjectSearchView, # <-- ADD
    StudentActivityLogView, # <-- ADD
    UnappointedOngoingProjectsView, # <-- NEW
)


urlpatterns = [
    path('projects/<int:project_id>/members/', TeamMemberView.as_view(), name='project-team-members'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/dashboard/groups/<int:group_id>/manage-users/', AdminGroupManagementView.as_view(), name='admin-manage-group-users'),
    path('admin/dashboard/users/<int:user_id>/update-role/', AdminUserRoleView.as_view(), name='admin-update-user-role'),
    # Admin
    path('admin/', admin.site.urls),
    
    # Authentication
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
    
    # Gamification
    path('gamification/', include('gamification.urls')),
    
    # Project submission
    path('projects/submit/', ProjectSubmissionView.as_view(), name='project-submit'),

    # Teacher dashboard
    path('teacher/submissions/', TeacherDashboardView.as_view(), name='teacher-submissions'),
    path('teacher/submissions/<int:submission_id>/', TeacherDashboardView.as_view(), name='teacher-submission-detail'),
    path('teacher/projects/<int:project_id>/viva-history/', ProjectVivaListView.as_view(), name='teacher-viva-history'),
    path('teacher/groups/', TeacherGroupListView.as_view(), name='teacher-group-list'),
    path('teacher/stats/', TeacherDashboardStatsView.as_view(), name='teacher-stats'),
    path('teacher/activity/', TeacherActivityFeedView.as_view(), name='teacher-activity'),
    
    # Student dashboard
    path('student/submissions/', StudentDashboardView.as_view(), name='student-submissions'),
    path('student/my-project/', StudentMyProjectView.as_view(), name='student-my-project'), # <-- NEW
    path('student/activity/', StudentActivityFeedView.as_view(), name='student-activity'),
    
    # AI features
    path('ai/chat/', AIChatbotView.as_view(), name='ai-chat'),
    path('ai/viva/', AIVivaView.as_view(), name='ai-viva'),
    path('ai/viva/evaluate/', AIVivaEvaluationView.as_view(), name='ai-viva-evaluate'),
    path('ai/project-inquiry/', ProjectInquiryView.as_view(), name='ai-project-inquiry'),
    
    # Project archive
    path('projects/archive/<int:project_id>/', ProjectArchiveView.as_view(), name='project-archive'),
    
    # Analytics & leaderboard
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    
    # Alumni portal
    path('alumni/my-projects/', AlumniPortalView.as_view(), name='alumni-my-projects'),
    path('alumni/top-projects/', TopAlumniProjectsView.as_view(), name='alumni-top-projects'),
    path('alumni/search/', AlumniProjectSearchView.as_view(), name='alumni-project-search'),
    
    # All projects
    path('projects/all/', AllProjectsView.as_view(), name='projects-all'),
    
    # Admin dashboard
    
    
    # Teacher appointment dashboards
    path('teacher/appointed/', AppointedTeacherDashboard.as_view(), name='teacher-appointed-submissions'),
    path('teacher/unappointed/', UnappointedTeacherDashboard.as_view(), name='teacher-unappointed-submissions'),
    path('teacher/unappointed-ongoing/', UnappointedOngoingProjectsView.as_view(), name='teacher-unappointed-ongoing'),
    path('teacher/approved-projects/', ApprovedProjectsView.as_view(), name='teacher-approved-projects'),

    # Project progress routes
    path('projects/progress/<int:project_id>/', ProjectProgressView.as_view(), name='project-progress-detail'),
    path('projects/<int:project_id>/log-update/', ProjectLogUpdateView.as_view(), name='project-log-update'),
    path('projects/<int:project_id>/update/', ProjectUpdateView.as_view(), name='project-update'), 

    path('projects/<int:project_id>/audit/', ProjectAuditView.as_view(), name='project-audit'), # <-- ADD
    path('projects/<int:project_id>/docs/generate/', ProjectDocsView.as_view(), name='project-docs-generate'), # <-- NEW

    path('projects/<int:project_id>/issues/analyze/', ProjectIssuesView.as_view(), name='project-issues-analyze'), # <-- NEW

    path('projects/<int:project_id>/auto-fix/', ProjectAutoFixView.as_view(), name='project-auto-fix'), # <-- NEW (PR Agent)
    path('projects/<int:project_id>/chat-codebase/', ProjectChatCodebaseView.as_view(), name='project-chat-codebase'), # <-- NEW (RAG)
    path('progress-updates/<int:update_id>/decision/', ProgressUpdateDecisionView.as_view(), name='progress-update-decision'), 

    # NEW PATH FOR TEACHER (ADD THIS):
    path('projects/<int:project_id>/progress-logs/', ProjectProgressLogListView.as_view(), name='project-progress-logs'),
    
    path('projects/<int:project_id>/messages/', ProjectMessagesView.as_view(), name='project-messages'),
      #
   # path('projects/progress/update/<int:submission_id>/', ProgressUpdateView.as_view(), name='project-progress-update'),  # PATCH update progress
    path('projects/<int:project_id>/messages/', ProjectMessagesView.as_view(), name='project-messages'),
    path('auth/password-reset/request/', RequestPasswordResetView.as_view(), name='password-reset-request'),
    path('auth/password-reset/confirm/', ResetPasswordView.as_view(), name='password-reset-confirm'),
    path('projects/<int:project_id>/artifacts/upload/', ProjectArtifactUploadView.as_view(), name='project-artifact-upload'),
    path('projects/<int:project_id>/artifacts/', ProjectArtifactListView.as_view(), name='project-artifact-list'),
    path('projects/<int:project_id>/report/upload/', ProjectReportUploadView.as_view(), name='project-report-upload'),
    path('projects/<int:project_id>/report/grade/', ProjectReportGradeView.as_view(), name='project-report-grade'),
    # Kanban Board
    path('projects/<int:project_id>/tasks/', ProjectTaskManagerView.as_view(), name='project-tasks'),
    path('tasks/<int:task_id>/update/', TaskUpdateView.as_view(), name='task-update'),
    path('projects/<int:project_id>/resume/generate/', ProjectResumeView.as_view(), name='project-resume-generate'),
    path('projects/<int:project_id>/messages/read/', MarkMessagesReadView.as_view(), name='mark-messages-read'),
    path('projects/<int:project_id>/typing/', TypingUpdateView.as_view(), name='project-typing'),
    path('projects/<int:project_id>/review-code/', CodeReviewView.as_view(), name='review-code'),
    
    # Checkpoint System
    path('projects/<int:project_id>/checkpoints/', CheckpointListView.as_view(), name='checkpoint-list'),
    path('projects/<int:project_id>/checkpoints/generate/', CheckpointGenerationView.as_view(), name='checkpoint-generate'),
    path('projects/<int:project_id>/checkpoints/<int:checkpoint_id>/verify/', CheckpointVerificationView.as_view(), name='checkpoint-verify'),
    
    # Timed Assignments
    path('assignments/create/', TimedAssignmentCreateView.as_view(), name='assignment-create'),
    path('assignments/list/', TimedAssignmentListView.as_view(), name='assignment-list'),
    path('assignments/<int:assignment_id>/submit/', AssignmentSubmissionView.as_view(), name='assignment-submit'),
    path('assignments/<int:assignment_id>/submissions/', AssignmentSubmissionsListView.as_view(), name='assignment-submissions'),
    
    # AI Mentor
    path('projects/extract-info/', ProjectExtractionView.as_view(), name='project-extract-info'),
    path('ai/mentor-chat/', ProjectMentorChatView.as_view(), name='ai-mentor-chat'),
    path('log-activity/', StudentActivityLogView.as_view(), name='log-activity'),
    
    # MCP Server Endpoint
    path('api/mcp/', MCPToolView.as_view(), name='django-mcp-server'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
