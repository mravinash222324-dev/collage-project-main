from authentication.models import User, Group, TimedAssignment

print("--- Debugging Assignments ---")

students = User.objects.filter(role='Student')
print(f"Found {students.count()} students.")

for student in students:
    print(f"\nStudent: {student.username} (ID: {student.id})")
    
    # Check Groups
    groups = student.student_groups.all()
    if groups.exists():
        print(f"  Groups: {', '.join([g.name for g in groups])}")
        
        for group in groups:
            assignments = group.assignments.all()
            if assignments.exists():
                print(f"    Assignments for group '{group.name}':")
                for a in assignments:
                    print(f"      - {a.title} (Active: {a.is_active})")
            else:
                print(f"    No assignments for group '{group.name}'")
    else:
        print("  No groups assigned.")
        
print("\n--- All Assignments ---")
all_assignments = TimedAssignment.objects.all()
for a in all_assignments:
    assigned_groups = a.assigned_groups.all()
    group_names = ", ".join([g.name for g in assigned_groups])
    print(f"Assignment: {a.title} (Assigned to: {group_names})")
