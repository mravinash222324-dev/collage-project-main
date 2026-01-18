
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

from authentication.models import User, Group, Project, ProjectSubmission

def seed_unassigned():
    # 1. Get or create a student
    student, _ = User.objects.get_or_create(username='test_student_x', defaults={'role': 'Student', 'first_name': 'Test', 'last_name': 'Student X'})
    
    # 2. Create a new group with NO teachers
    group, _ = Group.objects.get_or_create(name='Unassigned Group X')
    group.teachers.clear() # Ensure no teachers
    group.students.add(student)
    
    # 3. Create a submission
    submission = ProjectSubmission.objects.create(
        student=student,
        group=group,
        title='Solar Powered IoT Weather Station',
        abstract_text='A project to monitor weather patterns using solar energy and IoT sensors.',
        status='Approved'
    )
    
    # 4. Create the project (Ongoing)
    project = Project.objects.create(
        submission=submission,
        title=submission.title,
        abstract=submission.abstract_text,
        status='In Progress'
    )
    
    print(f"Created Unassigned Ongoing Project: {project.title}")
    print(f"Group: {group.name}, Teachers count: {group.teachers.count()}")

if __name__ == '__main__':
    seed_unassigned()
