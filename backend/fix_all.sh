#!/bin/bash

echo "🔧 Fixing all CONCOUR DOCTORA Backend Issues"

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Activate virtual environment if exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

echo "📦 Upgrading pip, setuptools, and wheel..."
pip install --upgrade pip setuptools wheel

echo "📦 Installing/Reinstalling core packages..."
# Uninstall problematic packages first
pip uninstall -y djangorestframework-simplejwt -q 2>/dev/null
pip uninstall -y setuptools -q 2>/dev/null

# Reinstall setuptools properly
pip install --upgrade setuptools==69.0.3 wheel

# Now reinstall simplejwt
pip install djangorestframework-simplejwt

# Install other missing packages
pip install django-cors-headers
pip install django-filter
pip install drf-yasg
pip install whitenoise

echo "📦 Installing Python 3.13 compatibility packages..."
pip install importlib-metadata
pip install setuptools-scm

# Create a patch for simplejwt if needed
echo "🩹 Creating compatibility patch if needed..."
SIMPLEJWT_PATH=$(python -c "import rest_framework_simplejwt; print(rest_framework_simplejwt.__path__[0])" 2>/dev/null)

if [ -d "$SIMPLEJWT_PATH" ]; then
    # Create a backup of the init file
    cp "$SIMPLEJWT_PATH/__init__.py" "$SIMPLEJWT_PATH/__init__.py.bak"
    
    # Replace the pkg_resources import with a try/except
    cat > "$SIMPLEJWT_PATH/__init__.py" << 'EOF'
"""Simple JWT"""
try:
    from importlib.metadata import version, PackageNotFoundError
    try:
        __version__ = version("djangorestframework-simplejwt")
    except PackageNotFoundError:
        # package is not installed
        __version__ = "unknown"
except ImportError:
    # Fallback for older Python versions
    try:
        from pkg_resources import get_distribution, DistributionNotFound
        try:
            __version__ = get_distribution("djangorestframework-simplejwt").version
        except DistributionNotFound:
            __version__ = "unknown"
    except ImportError:
        __version__ = "unknown"

__all__ = ["__version__"]
EOF
    echo "✅ Patched simplejwt for Python 3.13"
fi

# Create or update settings_local.py
echo "⚙️ Updating local settings..."
cat > concour_doctora/settings_local.py << 'EOF'
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
EOF

# Update .env file
echo "📝 Updating .env file..."
cat > .env << 'EOF'
DEBUG=True
SECRET_KEY=django-insecure-$(date +%s | sha256sum | base64 | head -c 50)
ALLOWED_HOSTS=localhost,127.0.0.1
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
FRONTEND_URL=http://localhost:5173
EOF

# Create media directories
echo "📁 Creating media directories..."
mkdir -p media/{scans,pv,candidate_photos,attendance_photos,signatures}

# Now try migrations
echo "🗄️ Running migrations..."
python manage.py makemigrations api
python manage.py migrate

# Create superuser
echo "👤 Creating superuser..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@esi-sba.dz', 'Admin123!')
    print('✅ Superuser created')
else:
    print('✅ Superuser already exists')
EOF

echo ""
echo "✅ All fixes applied!"
echo ""
echo "🚀 Start the server:"
echo "   python manage.py runserver"
echo ""
echo "📊 Test URLs:"
echo "   Admin: http://127.0.0.1:8000/admin/"
echo "   API: http://127.0.0.1:8000/api/"

