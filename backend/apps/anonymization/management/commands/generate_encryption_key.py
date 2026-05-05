from cryptography.fernet import Fernet
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Generate a Fernet encryption key for the anonymization module."

    def handle(self, *args, **options):
        key = Fernet.generate_key().decode()
        self.stdout.write(self.style.SUCCESS(key))
        self.stderr.write(
            f"\nAdd this to your .env file:\nANONYMIZATION_ENCRYPTION_KEY={key}\n"
        )
