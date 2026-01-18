# authentication/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ProjectSubmission, Project, Team, Group, ProjectArtifact

# Use a custom admin class to display the 'role' field
class CustomUserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        (None, {'fields': ('role',)}),
    )

# New admin class to display the ID and other fields in the list view
class ProjectSubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'student', 'status', 'submitted_at')
    list_filter = ('status', 'submitted_at')
    search_fields = ('title', 'student__username')

# Register the Group model we created
admin.site.register(Group)

# Register all of our other models with their admin classes
admin.site.register(User, CustomUserAdmin)
admin.site.register(ProjectSubmission, ProjectSubmissionAdmin)
admin.site.register(Project)
admin.site.register(Team)
@admin.register(ProjectArtifact)
class ProjectArtifactAdmin(admin.ModelAdmin):
    list_display = ('project', 'uploaded_at', 'short_description')
    readonly_fields = ('extracted_text', 'ai_tags', 'uploaded_at')

    def short_description(self, obj):
        return obj.description[:50]