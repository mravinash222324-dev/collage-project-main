from django.db import models
from authentication.models import User

class StudentXP(models.Model):
    student = models.OneToOneField(User, on_delete=models.CASCADE, related_name='xp_profile')
    total_xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    
    # Breakdown
    viva_xp = models.IntegerField(default=0)
    assignment_xp = models.IntegerField(default=0)
    boss_battle_xp = models.IntegerField(default=0)
    
    # Avatar Customization
    avatar_style = models.CharField(max_length=50, default='avataaars')
    avatar_seed = models.CharField(max_length=100, default='felix')
    
    def calculate_level(self):
        # Simple formula: Level = 1 + (Total XP / 100)
        return 1 + (self.total_xp // 100)

    def save(self, *args, **kwargs):
        self.level = self.calculate_level()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.username} - Lvl {self.level} ({self.total_xp} XP)"

class XPLog(models.Model):
    SOURCE_CHOICES = (
        ('VIVA', 'Viva Voce'),
        ('ASSIGNMENT', 'Assignment'),
        ('BOSS_BATTLE', 'Boss Battle'),
        ('BONUS', 'Bonus'),
    )
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='xp_logs')
    amount = models.IntegerField()
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.student.username} gained {self.amount} XP from {self.source}"

class Badge(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, default="Trophy") # Lucide icon name
    xp_required = models.IntegerField(default=0)
    
    owners = models.ManyToManyField(User, related_name='badges', blank=True)
    
    def __str__(self):
        return self.name
