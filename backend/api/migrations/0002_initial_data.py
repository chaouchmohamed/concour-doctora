# backend/api/migrations/0002_initial_data.py
"""
Initial data migration with seed data for testing
"""
from django.db import migrations
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from datetime import date, timedelta
import random


def create_initial_data(apps, schema_editor):
    """Create initial test data"""
    User = apps.get_model('auth', 'User')
    UserProfile = apps.get_model('api', 'UserProfile')
    ExamSession = apps.get_model('api', 'ExamSession')
    Room = apps.get_model('api', 'Room')
    Subject = apps.get_model('api', 'Subject')
    Candidate = apps.get_model('api', 'Candidate')
    AnonymousCode = apps.get_model('api', 'AnonymousCode')
    Attendance = apps.get_model('api', 'Attendance')
    Copy = apps.get_model('api', 'Copy')
    Correction = apps.get_model('api', 'Correction')
    Discrepancy = apps.get_model('api', 'Discrepancy')
    Deliberation = apps.get_model('api', 'Deliberation')
    AuditLog = apps.get_model('api', 'AuditLog')
    
    # Create users with different roles
    users_data = [
        {
            'username': 'admin',
            'email': 'admin@esi-sba.dz',
            'password': 'Admin123!',
            'first_name': 'Admin',
            'last_name': 'User',
            'role': 'ADMIN',
            'is_superuser': True,
            'is_staff': True
        },
        {
            'username': 'cfd',
            'email': 'cfd@esi-sba.dz',
            'password': 'Cfd123!',
            'first_name': 'CFD',
            'last_name': 'Head',
            'role': 'CFD_HEAD'
        },
        {
            'username': 'coord',
            'email': 'coord@esi-sba.dz',
            'password': 'Coord123!',
            'first_name': 'Exam',
            'last_name': 'Coordinator',
            'role': 'COORDINATOR'
        },
        {
            'username': 'correct1',
            'email': 'correct@esi-sba.dz',
            'password': 'Correct123!',
            'first_name': 'John',
            'last_name': 'Corrector',
            'role': 'CORRECTOR'
        },
        {
            'username': 'correct2',
            'email': 'correct2@esi-sba.dz',
            'password': 'Correct123!',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'role': 'CORRECTOR'
        },
        {
            'username': 'supervisor',
            'email': 'super@esi-sba.dz',
            'password': 'Super123!',
            'first_name': 'Mike',
            'last_name': 'Supervisor',
            'role': 'SUPERVISOR'
        },
        {
            'username': 'jury1',
            'email': 'jury@esi-sba.dz',
            'password': 'Jury123!',
            'first_name': 'Sarah',
            'last_name': 'Johnson',
            'role': 'JURY_MEMBER'
        },
        {
            'username': 'jury2',
            'email': 'jury2@esi-sba.dz',
            'password': 'Jury123!',
            'first_name': 'Ahmed',
            'last_name': 'Benali',
            'role': 'JURY_MEMBER'
        },
    ]
    
    created_users = []
    for user_data in users_data:
        user = User.objects.create(
            username=user_data['username'],
            email=user_data['email'],
            password=make_password(user_data['password']),
            first_name=user_data.get('first_name', ''),
            last_name=user_data.get('last_name', ''),
            is_superuser=user_data.get('is_superuser', False),
            is_staff=user_data.get('is_staff', False),
            is_active=True
        )
        created_users.append(user)
        
        UserProfile.objects.create(
            user=user,
            role=user_data['role']
        )
    
    # Create exam session
    session = ExamSession.objects.create(
        name='Doctorat 2024',
        year=2024,
        date=date(2024, 6, 15),
        status='ACTIVE',
        description='Session principale Doctorat 2024',
        created_by=created_users[2]  # coordinator
    )
    
    # Create rooms
    rooms = []
    rooms_data = [
        {'name': 'Amphi A', 'capacity': 100, 'building': 'Bâtiment Principal'},
        {'name': 'Salle 101', 'capacity': 30, 'building': 'Bâtiment A'},
        {'name': 'Salle 102', 'capacity': 30, 'building': 'Bâtiment A'},
        {'name': 'Labo 1', 'capacity': 20, 'building': 'Bâtiment B'},
    ]
    
    for room_data in rooms_data:
        room = Room.objects.create(**room_data)
        rooms.append(room)
    
    # Create subjects
    subjects = []
    subjects_data = [
        {
            'name': 'Mathématiques',
            'code': 'MATH01',
            'coefficient': 3,
            'max_score': 20,
            'discrepancy_threshold': 2,
            'final_grade_rule': 'AVERAGE',
            'status': 'ACTIVE',
            'exam_session': session,
            'scheduled_date': date(2024, 6, 15),
            'start_time': '09:00:00',
            'duration_minutes': 180,
            'room': rooms[0]
        },
        {
            'name': 'Informatique',
            'code': 'INFO01',
            'coefficient': 4,
            'max_score': 20,
            'discrepancy_threshold': 2,
            'final_grade_rule': 'AVERAGE',
            'status': 'ACTIVE',
            'exam_session': session,
            'scheduled_date': date(2024, 6, 16),
            'start_time': '09:00:00',
            'duration_minutes': 180,
            'room': rooms[1]
        },
        {
            'name': 'Anglais',
            'code': 'ANG01',
            'coefficient': 1,
            'max_score': 20,
            'discrepancy_threshold': 1.5,
            'final_grade_rule': 'AVERAGE',
            'status': 'ACTIVE',
            'exam_session': session,
            'scheduled_date': date(2024, 6, 17),
            'start_time': '14:00:00',
            'duration_minutes': 120,
            'room': rooms[2]
        },
    ]
    
    for subject_data in subjects_data:
        subject = Subject.objects.create(**subject_data)
        subjects.append(subject)
    
    # Create candidates (25 samples)
    candidates = []
    first_names = ['Mohamed', 'Ahmed', 'Fatima', 'Karim', 'Samira', 'Ali', 'Nadia', 'Omar', 'Leila', 'Hassan',
                   'Yasmine', 'Rachid', 'Amina', 'Sofiane', 'Meriem', 'Walid', 'Nora', 'Tarek', 'Salima', 'Amine',
                   'Loubna', 'Farid', 'Zahra', 'Mounir', 'Djamila']
    last_names = ['Benali', 'Boukhrissa', 'Boudiaf', 'Cherif', 'Dahmani', 'Ferhat', 'Gacem', 'Hamdi', 'Ibrahim', 'Kaci',
                  'Lounis', 'Messaoudi', 'Noureddine', 'Ouali', 'Rahmani', 'Slimani', 'Touati', 'Yahiaoui', 'Zidane']
    
    for i in range(25):
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        email = f"{first_name.lower()}.{last_name.lower()}@etu.esi-sba.dz"
        
        candidate = Candidate.objects.create(
            first_name=first_name,
            last_name=last_name,
            national_id=f"{random.randint(100000000000000000, 999999999999999999)}",
            email=email,
            phone=f"0555{random.randint(100000, 999999)}",
            date_of_birth=date(1995, random.randint(1, 12), random.randint(1, 28)),
            place_of_birth=random.choice(['Alger', 'Oran', 'Constantine', 'Annaba', 'SBA']),
            address=f"{random.randint(1, 100)} Rue {random.choice(['Didouche', 'Larbi', 'Khemisti'])}",
            status=random.choices(['REGISTERED', 'PRESENT', 'ELIMINATED'], weights=[0.3, 0.6, 0.1])[0],
            exam_session=session,
            created_by=created_users[2]
        )
        candidates.append(candidate)
    
    # Create anonymous codes for candidates (skip eliminated ones)
    anonymous_codes = []
    for candidate in candidates:
        if candidate.status != 'ELIMINATED':
            code = AnonymousCode.objects.create(
                candidate=candidate,
                generated_by=created_users[2]
            )
            anonymous_codes.append(code)
    
    # Create attendance records
    for candidate in candidates:
        if candidate.status in ['PRESENT', 'ELIMINATED']:
            Attendance.objects.create(
                candidate=candidate,
                session=session,
                present=(candidate.status == 'PRESENT'),
                marked_by=random.choice([created_users[5], created_users[6]]),  # supervisor or jury
                notes='' if candidate.status == 'PRESENT' else 'Absent justifié'
            )
    
    # Create copies for present candidates
    copies = []
    present_candidates = [c for c in candidates if c.status == 'PRESENT']
    for candidate in present_candidates:
        for subject in subjects:
            if hasattr(candidate, 'anonymous_code'):
                copy = Copy.objects.create(
                    anonymous_code=candidate.anonymous_code,
                    subject=subject,
                    scan_file=f'scans/sample_{candidate.id}_{subject.id}.pdf',
                    uploaded_by=created_users[2],
                    qr_detected=random.choice([True, False]),
                    page_count=random.randint(4, 10)
                )
                copies.append(copy)
    
    # Create corrections (double-blind)
    correctors = [created_users[3], created_users[4]]  # two correctors
    for copy in copies[:15]:  # Only first 15 copies get corrections
        # First correction
        grade1 = random.uniform(10, 18)
        Correction.objects.create(
            copy=copy,
            corrector=correctors[0],
            grade=round(grade1, 2),
            comment='Bon travail' if grade1 > 14 else 'Peut mieux faire',
            attempt=1
        )
        
        # Second correction
        grade2 = random.uniform(10, 18)
        Correction.objects.create(
            copy=copy,
            corrector=correctors[1],
            grade=round(grade2, 2),
            comment='Correct' if grade2 > 14 else 'À revoir',
            attempt=2
        )
        
        # Check for discrepancy
        if abs(grade1 - grade2) > 2:
            Discrepancy.objects.create(
                copy=copy,
                grade1=round(grade1, 2),
                grade2=round(grade2, 2),
                difference=round(abs(grade1 - grade2), 2),
                resolved=False
            )
    
    # Create one resolved discrepancy as example
    if copies:
        copy_with_discrepancy = copies[0]
        Discrepancy.objects.create(
            copy=copy_with_discrepancy,
            grade1=12.5,
            grade2=16.0,
            difference=3.5,
            resolved=True,
            third_corrector=created_users[2],
            third_grade=14.0,
            final_grade=14.0,
            coordinator_note='Moyenne des trois',
            resolved_at=timezone.now()
        )
    
    # Create audit logs
    AuditLog.objects.create(
        user=created_users[2],
        action='CREATE',
        object_type='ExamSession',
        object_id=session.id,
        details={'name': session.name, 'year': session.year},
        ip_address='127.0.0.1',
        user_agent='Django Migration'
    )
    
    AuditLog.objects.create(
        user=created_users[0],
        action='LOGIN',
        object_type='Auth',
        ip_address='127.0.0.1',
        user_agent='Chrome/120.0'
    )


def reverse_initial_data(apps, schema_editor):
    """Remove initial data"""
    User = apps.get_model('auth', 'User')
    ExamSession = apps.get_model('api', 'ExamSession')
    
    # Delete all non-superuser users created by migration
    User.objects.exclude(is_superuser=True).delete()
    
    # Delete all exam sessions
    ExamSession.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0001_initial'),  # Replace with your actual initial migration
    ]
    
    operations = [
        migrations.RunPython(create_initial_data, reverse_initial_data),
    ]