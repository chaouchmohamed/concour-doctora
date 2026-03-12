# Local development settings
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# Use SQLite for development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Disable MySQL warnings
import warnings
warnings.filterwarnings('ignore', category=UserWarning, module='django.db.backends.mysql')

# Simple JWT settings (ensure they're defined)
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': 60,  # minutes
    'REFRESH_TOKEN_LIFETIME': 1,  # days
}
