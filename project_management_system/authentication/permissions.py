from rest_framework import permissions
from .models import Project, Team
class IsTeacherOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow only 'Teacher' or 'HOD/Admin' users to access a view.
    """
    def has_permission(self, request, view):
        # Allow read-only access for anyone (GET requests) but restrict POST/PATCH/DELETE
        # For this view, we'll require a specific role for all methods
        return request.user.role in ['Teacher', 'HOD/Admin']

class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to currently allow only 'HOD/Admin' users.
    Teachers should NOT have access.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'HOD/Admin'

class IsProjectMemberOrTeacher(permissions.BasePermission):
    """
    Allows access only to:
    - Members of the project team (students).
    - Teachers assigned to the group associated with the project.
    """
    def has_permission(self, request, view):
        # 0. Allow Admin/HOD always
        if request.user.role == 'HOD/Admin' or request.user.is_superuser:
            return True

        if 'project_id' in view.kwargs:
            # ... existing logic ...
            project_id = view.kwargs['project_id']
            try:
                project = Project.objects.get(id=project_id)
                return self.has_object_permission(request, view, project)
            except Project.DoesNotExist:
                print(f"DEBUG: Project {project_id} not found.")
                return False
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # 0. Allow Admin/HOD always
        if user.role == 'HOD/Admin' or user.is_superuser:
            return True
        
        if isinstance(obj, Project):
            # ... existing logic ...
            project = obj
        elif hasattr(obj, 'project'):
             project = obj.project
        else:
             print("DEBUG: Object has no project context.")
             return False

        # 0. Check owner
        try:
            if project.submission.student == user:
                return True
        except:
            pass

        # 1. Check team
        try:
            if user in project.team.members.all():
                return True
        except Team.DoesNotExist:
             pass 

        # 2. Check teacher
        try:
            if project.submission and project.submission.group:
                 if user in project.submission.group.teachers.all():
                      return True
        except AttributeError:
             pass
        
        print(f"DEBUG: Permission Denied for User {user.id} on Project {project.id}")
        return False