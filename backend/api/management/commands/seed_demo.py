"""
Seed a small demo exam session with candidates.
Run with: python manage.py seed_demo
"""
from datetime import date, time
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from api.models import Candidate, ExamSession, Room, Subject


DEMO_CANDIDATES = [
    ("Amina", "Benkhelifa", "1999-02-14", "Sidi Bel Abbes"),
    ("Yacine", "Mansouri", "1998-07-03", "Oran"),
    ("Sara", "Boudjemaa", "2000-01-22", "Tlemcen"),
    ("Mehdi", "Kara", "1997-11-09", "Alger"),
    ("Lina", "Saidi", "1999-05-18", "Mascara"),
    ("Nadir", "Haddad", "1998-09-30", "Mostaganem"),
    ("Imane", "Zerrouki", "2000-04-12", "Relizane"),
    ("Riad", "Belkacem", "1997-12-25", "Tiaret"),
    ("Nour", "Cherif", "1999-08-07", "Saida"),
    ("Samir", "Meziane", "1998-03-16", "Ain Temouchent"),
    ("Khadidja", "Amrani", "2000-06-28", "Bechar"),
    ("Walid", "Dahmani", "1997-10-05", "Blida"),
]


class Command(BaseCommand):
    help = "Seed demo session, room, subject, and candidates for local testing"

    def handle(self, *args, **options):
        admin = User.objects.filter(username="admin").first()

        session, _ = ExamSession.objects.update_or_create(
            name="Doctoral Competition Demo",
            year=2026,
            defaults={
                "date": date(2026, 6, 15),
                "status": "ACTIVE",
                "description": "Local demo session for frontend and API testing.",
                "created_by": admin,
            },
        )

        room, _ = Room.objects.update_or_create(
            name="Amphi A",
            defaults={
                "capacity": 120,
                "building": "Main Campus",
                "floor": 1,
                "has_projector": True,
                "has_air_conditioning": True,
                "is_active": True,
            },
        )

        Subject.objects.update_or_create(
            exam_session=session,
            code="CS-ALG",
            defaults={
                "name": "Algorithms and Data Structures",
                "coefficient": Decimal("3.00"),
                "max_score": Decimal("20.00"),
                "discrepancy_threshold": Decimal("3.00"),
                "final_grade_rule": "AVERAGE",
                "status": "ACTIVE",
                "scheduled_date": date(2026, 6, 15),
                "start_time": time(9, 0),
                "duration_minutes": 180,
                "room": room,
            },
        )

        created = 0
        updated = 0
        for index, (first_name, last_name, birth_date, birth_place) in enumerate(DEMO_CANDIDATES, start=1):
            national_id = f"20260000000000{index:04d}"
            candidate, was_created = Candidate.objects.update_or_create(
                national_id=national_id,
                defaults={
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": f"candidate{index:02d}@example.test",
                    "phone": f"055500{index:04d}",
                    "date_of_birth": birth_date,
                    "place_of_birth": birth_place,
                    "address": f"{index} Demo Street, {birth_place}",
                    "status": "REGISTERED",
                    "exam_session": session,
                    "created_by": admin,
                },
            )
            created += int(was_created)
            updated += int(not was_created)

        self.stdout.write(self.style.SUCCESS("Demo data ready."))
        self.stdout.write(f"  Session: {session.name} ({session.year})")
        self.stdout.write(f"  Room: {room.name}")
        self.stdout.write(f"  Candidates created: {created}")
        self.stdout.write(f"  Candidates updated: {updated}")
