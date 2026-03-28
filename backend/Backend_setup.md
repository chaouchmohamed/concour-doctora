# Backend Setup Guide — CONCOUR DOCTORA

> Follow these steps exactly, one by one.

---

## 1. Clone the repo

```bash
git clone https://github.com/chaouchmohamed/concour-doctora.git
cd concour-doctora/backend
```

---

## 2. Create and activate virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt. **Keep it activated for all steps below.**

---

## 3. Install dependencies

```bash
pip install --upgrade pip setuptools
pip install Django==4.2.7 djangorestframework==3.14.0 djangorestframework-simplejwt==5.3.0 django-cors-headers==4.3.1 python-dotenv==1.0.0 "Pillow>=10.3.0" reportlab drf-yasg django-filter whitenoise
```

---

## 4. Fix simplejwt compatibility with Python 3.13

```bash
sed -i 's/from pkg_resources import DistributionNotFound, get_distribution/from importlib.metadata import PackageNotFoundError as DistributionNotFound, version as _version\ndef get_distribution(name):\n    class D:\n        def __init__(self, v): self.version = v\n    return D(_version(name))/' venv/lib/python3.13/site-packages/rest_framework_simplejwt/__init__.py
```

> Skip this step if you are on Python 3.10 or 3.11.

---

## 5. Create the `.env` file

```bash
cat > .env << 'EOF'
DEBUG=True
SECRET_KEY=django-insecure-replace-this-key
ALLOWED_HOSTS=localhost,127.0.0.1
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
FRONTEND_URL=http://localhost:5173
EOF
```

---

## 6. Clean and run migrations

```bash
find api/migrations -name "*.py" -not -name "__init__.py" -delete
find api/migrations -name "*.pyc" -delete
python manage.py makemigrations api
python manage.py migrate
```

Expected output ends with:

```
Applying sessions.0001_initial... OK
```

---

## 7. Create admin user

```bash
python manage.py createsuperuser
```

When prompted:

- **Username:** `admin`
- **Email:** `admin@esi-sba.dz`
- **Password:** `Admin123!` _(type `y` if it asks to bypass validation)_

---

## 8. Create media directories

```bash
mkdir -p media/{scans,pv,candidate_photos,attendance_photos,signatures}
```

---

## 9. Start the server

```bash
python manage.py runserver
```

You should see:

```
Starting development server at http://127.0.0.1:8000/
```

---

## 10. Verify it works

Open these in your browser:

| URL                              | What you should see |
| -------------------------------- | ------------------- |
| `http://127.0.0.1:8000/admin/`   | Django admin login  |
| `http://127.0.0.1:8000/api/`     | API root            |
| `http://127.0.0.1:8000/swagger/` | Swagger docs        |

Login to admin with `admin` / `Admin123!`
Login to admin with `bakirou` / `aboubakr123!`

---

## Troubleshooting

| Error                             | Fix                                            |
| --------------------------------- | ---------------------------------------------- |
| `No module named 'X'`             | `pip install X`                                |
| `No module named 'pkg_resources'` | Run the fix in step 4                          |
| `UNIQUE constraint failed`        | `rm -f db.sqlite3` then redo step 6            |
| `venv/bin/activate: not found`    | Run step 2 again from the `backend/` directory |
| Port 8000 in use                  | `fuser -k 8000/tcp` then retry                 |
