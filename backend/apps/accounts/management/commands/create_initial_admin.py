from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create an initial ADMIN account (invite-free bootstrap command)."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--password", required=True)

    def handle(self, *args, **options):
        User = get_user_model()
        email = options["email"]
        password = options["password"]

        if User.objects.filter(email=email).exists():
            raise CommandError("User already exists")

        User.objects.create_superuser(email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"Created ADMIN user: {email}"))
