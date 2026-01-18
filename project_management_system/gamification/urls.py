from django.urls import path
from .views import LeaderboardView, StudentStatsView, AvatarUpdateView, ProjectTimeCapsuleView


urlpatterns = [
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('me/', StudentStatsView.as_view(), name='student-stats'),
    path('avatar/update/', AvatarUpdateView.as_view(), name='avatar-update'),
    path('time-capsule/', ProjectTimeCapsuleView.as_view(), name='time-capsule'),

]
