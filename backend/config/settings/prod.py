from .base import *

import os
import dj_database_url
from .base import *  # importe les settings de base

DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('MYSQL_URL')
    )
}
DEBUG = False

SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# TODO: set strict host list and trusted origins from deployment env.
