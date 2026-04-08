import os
from django.core.wsgi import get_wsgi_application

from config.env import bootstrap_environment

bootstrap_environment()
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

application = get_wsgi_application()
