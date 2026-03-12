"""
WSGI config for concour_doctora project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'concour_doctora.settings')

application = get_wsgi_application()