import os
from django.core.asgi import get_asgi_application

from config.env import bootstrap_environment

bootstrap_environment()
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

application = get_asgi_application()
