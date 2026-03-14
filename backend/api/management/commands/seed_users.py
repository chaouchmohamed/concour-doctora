"""
Management command to seed one test user per role.
Run with: python manage.py seed_users
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import UserProfile


SEED_USERS = [
    {
        'username': 'admin',
        'password': 'Admin@1234',
        'first_name': 'Ahmed',
        'last_name': 'Benali',
        'email': 'admin@concours.dz',
        'role': 'ADMIN',
    },
    {
        'username': 'cfd_head',
        'password': 'Cfd@1234',
        'first_name': 'Fatima',
        'last_name': 'Zahraoui',
        'email': 'cfd.head@concours.dz',
        'role': 'CFD_HEAD',
    },
    {
        'username': 'coordinator',
        'password': 'Coord@1234',
        'first_name': 'Karim',
        'last_name': 'Messaoudi',
        'email': 'coordinator@concours.dz',
        'role': 'COORDINATOR',
    },
    {
        'username': 'corrector',
        'password': 'Corrector@1234',
        'first_name': 'Yasmine',
        'last_name': 'Boudiaf',
        'email': 'corrector@concours.dz',
        'role': 'CORRECTOR',
    },
    {
        'username': 'supervisor',
        'password': 'Super@1234',
        'first_name': 'Omar',
        'last_name': 'Khelil',
        'email': 'supervisor@concours.dz',
        'role': 'SUPERVISOR',
    },
    {
        'username': 'jury_president',
        'password': 'JuryP@1234',
        'first_name': 'Rachid',
        'last_name': 'Hamidi',
        'email': 'jury.president@concours.dz',
        'role': 'JURY_PRESIDENT',
    },
    {
        'username': 'jury_member',
        'password': 'JuryM@1234',
        'first_name': 'Nadia',
        'last_name': 'Sahraoui',
        'email': 'jury.member@concours.dz',
        'role': 'JURY_MEMBER',
    },
    {
        'username': 'anon_commission',
        'password': 'Anon@1234',
        'first_name': 'Tarek',
        'last_name': 'Aissaoui',
        'email': 'anon.commission@concours.dz',
        'role': 'ANONYMITY_COMMISSION',
    },
]


class Command(BaseCommand):
    help = 'Seed one test user per role for development/testing'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('Seeding test users...'))

        for data in SEED_USERS:
            username = data['username']
            role = data['role']

            # Create or update user
            user, created = User.objects.get_or_create(username=username)
            user.set_password(data['password'])
            user.first_name = data['first_name']
            user.last_name = data['last_name']
            user.email = data['email']
            user.is_active = True
            user.save()

            # Create or update profile
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.role = role
            profile.save()

            action = 'Created' if created else 'Updated'
            self.stdout.write(
                self.style.SUCCESS(
                    f'  {action}: {username} ({role}) — password: {data["password"]}'
                )
            )

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('✓ All test users seeded successfully!'))
        self.stdout.write('')
        self.stdout.write('  Credentials summary:')
        self.stdout.write('  ┌─────────────────────┬───────────────────────┬──────────────────────┐')
        self.stdout.write('  │ Username             │ Role                  │ Password             │')
        self.stdout.write('  ├─────────────────────┼───────────────────────┼──────────────────────┤')
        for u in SEED_USERS:
            self.stdout.write(
                f"  │ {u['username']:<20}│ {u['role']:<22}│ {u['password']:<21}│"
            )
        self.stdout.write('  └─────────────────────┴───────────────────────┴──────────────────────┘')
