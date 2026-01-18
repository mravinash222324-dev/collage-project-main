from django.db.models.signals import post_save
from django.dispatch import receiver
from authentication.models import AssignmentSubmission, VivaQuestion, User
from .models import StudentXP, XPLog

@receiver(post_save, sender=User)
def create_student_xp(sender, instance, created, **kwargs):
    if created and instance.role == 'Student':
        StudentXP.objects.create(student=instance)

@receiver(post_save, sender=AssignmentSubmission)
def award_assignment_xp(sender, instance, created, **kwargs):
    # Check if AI has verified and scored the submission
    if instance.ai_verified and instance.ai_score is not None:
        student = instance.submitted_by
        xp_profile, _ = StudentXP.objects.get_or_create(student=student)
        
        # Check if we already awarded XP for this submission
        # We use a unique description pattern to identify
        log_desc = f"Assignment: {instance.assignment.title} (ID: {instance.id})"
        if XPLog.objects.filter(student=student, description=log_desc).exists():
            return

        # Calculate XP
        base_xp = 50
        score_xp = instance.ai_score # Assuming score is 0-100
        total_award = base_xp + score_xp
        
        # Update Profile
        xp_profile.total_xp += total_award
        xp_profile.assignment_xp += total_award
        xp_profile.save()
        
        # Log it
        XPLog.objects.create(
            student=student,
            amount=total_award,
            source='ASSIGNMENT',
            description=log_desc
        )

@receiver(post_save, sender=VivaQuestion)
def award_viva_xp(sender, instance, created, **kwargs):
    # Award XP for each answered and scored question
    if instance.ai_score is not None:
        session = instance.session
        student = session.student
        xp_profile, _ = StudentXP.objects.get_or_create(student=student)
        
        log_desc = f"Viva Question ID: {instance.id}"
        if XPLog.objects.filter(student=student, description=log_desc).exists():
            return
            
        # Calculate XP: 10 XP per point (assuming score is 0-10)
        award = instance.ai_score * 10
        
        if award > 0:
            xp_profile.total_xp += award
            xp_profile.viva_xp += award
            xp_profile.save()
            
            XPLog.objects.create(
                student=student,
                amount=award,
                source='VIVA',
                description=log_desc
            )
