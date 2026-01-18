
with open('authentication/views.py', 'a', encoding='utf-8') as f:
    f.write('''

class TeacherGroupListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]
    serializer_class = GroupSerializer
    queryset = Group.objects.all()
''')
print("Appended TeacherGroupListView")
