# CONCOUR DOCTORA

> Doctoral Entrance Examination Management System — ESI-SBA

<div align="center">

![Django](https://img.shields.io/badge/Django-4.2.7-092E20?style=for-the-badge&logo=django)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.3.6-38B2AC?style=for-the-badge&logo=tailwind-css)
![DRF](https://img.shields.io/badge/DRF-3.14.0-ff1709?style=for-the-badge&logo=django)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

A full-stack platform to digitize the doctoral entrance examination process at **École Supérieure d'Informatique de Sidi Bel Abbès (ESI-SBA)**.

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Backend](#running-the-backend)
- [Running the Frontend](#running-the-frontend)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Overview

CONCOUR DOCTORA replaces paper-based exam workflows with a secure, auditable digital system. It covers every stage of the process — from candidate registration to final deliberation with digital signatures.

**Key highlights:**
- Double-blind correction to ensure fairness
- Real-time attendance tracking (PWA, offline-capable)
- Immutable audit logs for all sensitive actions
- JWT authentication with role-based access control
- PDF generation for official reports (PVs)

---

## Features

| Module | Description |
|---|---|
| **F1 — Candidate Management** | CSV bulk import, manual creation, status tracking, email convocations |
| **F2 — Exam Planning** | Sessions, subjects, room assignment, call list PDF generation |
| **F3 — Attendance (PWA)** | Mobile-optimized, offline support, incident reporting with photos |
| **F4 — Anonymization** | Anonymous code generation (DOCT-YYYY-XXXX), QR scan simulation, PV generation |
| **F5 — Double-Blind Correction** | Split view with PDF viewer, two independent correctors, automatic discrepancy detection, third corrector arbitration |
| **F6 — Deliberation** | Anonymous ranking, threshold config, multi-step closing, digital signatures, identity reveal |
| **F7 — Audit Logging** | Immutable logs, filterable by user/action/date, CSV export, 20+ action types |

---

## Tech Stack

**Backend**

| Package | Version | Purpose |
|---|---|---|
| Django | 4.2.7 | Web framework |
| Django REST Framework | 3.14.0 | API development |
| Django SimpleJWT | 5.3.0 | JWT authentication |
| MySQL | 8.0 | Production database |
| SQLite | 3.x | Development database |
| ReportLab | 4.0.9 | PDF generation |
| Celery | 5.3.4 | Async tasks |
| Redis | 5.0.1 | Message broker |
| Django CORS Headers | 4.3.1 | CORS management |

**Frontend**

| Package | Version | Purpose |
|---|---|---|
| React | 18.2.0 | UI library |
| Vite | 5.0.8 | Build tool |
| React Router | 6.20.0 | Routing |
| TanStack Query | 5.12.0 | Data fetching & caching |
| TailwindCSS | 3.3.6 | Styling |
| Framer Motion | 10.16.5 | Animations |
| Axios | 1.6.2 | HTTP client |
| React Hook Form | 7.48.0 | Form handling |
| React PDF | 7.5.0 | In-browser PDF viewer |

---

## Project Structure

```
concour-doctora/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── media/                        # Uploaded files
│   │   ├── scans/
│   │   ├── pv/
│   │   ├── candidate_photos/
│   │   └── signatures/
│   ├── concour_doctora/              # Django project config
│   │   ├── settings.py
│   │   ├── settings_local.py         # Local overrides (create this)
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── api/                          # Main API app
│   │   ├── models.py                 # 8 database models
│   │   ├── views.py                  # 30+ API views
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── permissions.py
│   │   └── migrations/
│   ├── auth_app/                     # Authentication
│   ├── pdf_generator/                # PDF generation
│   └── utils/
│       ├── audit.py
│       └── anonymizer.py
│
└── frontend/
    ├── vite.config.js
    ├── tailwind.config.js
    ├── package.json
    └── src/
        ├── api/                      # Axios + API calls
        ├── components/
        │   ├── layout/               # AppShell, Sidebar, Topbar
        │   └── ui/                   # Button, Modal, ...
        ├── pages/                    # All route pages
        ├── context/                  # AuthContext
        ├── hooks/
        ├── guards/                   # Route guards
        └── utils/
```

---

## Prerequisites

- **Python** 3.10 or 3.11 *(3.13 has known compatibility issues)*
- **Node.js** 18+ and npm
- **Git**
- **MySQL 8.0** (production) or **SQLite** (development — no setup needed)
- **Redis** (optional, required for Celery tasks)

Verify your versions:

```bash
python --version
node --version
npm --version
```

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/chaouchmohamed/concour-doctora.git
cd concour-doctora
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python3.10 -m venv venv
source venv/bin/activate         # Linux/macOS
# venv\Scripts\activate          # Windows

pip install --upgrade pip
pip install -r requirements.txt
```

> **If `mysqlclient` fails to install:**
> ```bash
> # Ubuntu/Debian
> sudo apt-get install python3-dev default-libmysqlclient-dev build-essential
>
> # macOS
> brew install mysql-client pkg-config
> export PKG_CONFIG_PATH="/usr/local/opt/mysql-client/lib/pkgconfig"
> ```

### 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
```

---

## Database Setup

### Option A — SQLite (Development, recommended)

Create the local settings override:

```bash
# backend/concour_doctora/settings_local.py
cat > concour_doctora/settings_local.py << 'EOF'
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
EOF
```

Create the `.env` file:

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

### Option B — MySQL (Production)

```sql
CREATE DATABASE concour_doctora CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'concour_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON concour_doctora.* TO 'concour_user'@'localhost';
FLUSH PRIVILEGES;
```

Then update your `.env`:

```
DB_ENGINE=django.db.backends.mysql
DB_NAME=concour_doctora
DB_USER=concour_user
DB_PASSWORD=your_strong_password
DB_HOST=localhost
DB_PORT=3306
```

---

## Running the Backend

```bash
cd backend
source venv/bin/activate

# Run migrations
python manage.py makemigrations api
python manage.py migrate

# Create admin user
python manage.py createsuperuser
# Username: admin | Email: admin@esi-sba.dz | Password: Admin123!

# Create media directories
mkdir -p media/{scans,pv,candidate_photos,attendance_photos,signatures}

# Start server
python manage.py runserver
```

The backend will be available at `http://127.0.0.1:8000`.

**Verify it's working:**

| URL | Description |
|---|---|
| `http://127.0.0.1:8000/admin/` | Django admin panel |
| `http://127.0.0.1:8000/api/` | API root |
| `http://127.0.0.1:8000/swagger/` | Swagger UI |
| `http://127.0.0.1:8000/redoc/` | ReDoc |

---

## Running the Frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

**Test credentials:**

| Role | Email | Password |
|---|---|---|
| Admin | admin@esi-sba.dz | Admin123! |
| CFD Head | cfd@esi-sba.dz | Cfd123! |
| Coordinator | coord@esi-sba.dz | Coord123! |
| Corrector | correct@esi-sba.dz | Correct123! |
| Supervisor | super@esi-sba.dz | Super123! |
| Jury Member | jury@esi-sba.dz | Jury123! |

---

## API Documentation

Interactive docs are available once the backend is running:

- **Swagger UI:** `http://localhost:8000/swagger/`
- **ReDoc:** `http://localhost:8000/redoc/`

**Key endpoints:**

| Endpoint | Method | Description | Auth |
|---|---|---|---|
| `/api/auth/login/` | POST | Get JWT tokens | Public |
| `/api/auth/refresh/` | POST | Refresh token | Public |
| `/api/auth/me/` | GET | Current user info | Required |
| `/api/candidates/` | GET / POST | List / create candidates | Coordinator+ |
| `/api/candidates/import_csv/` | POST | Bulk CSV import | Coordinator+ |
| `/api/candidates/export/` | GET | Export candidates | Coordinator+ |
| `/api/sessions/` | GET / POST | List / create sessions | Coordinator+ |
| `/api/attendance/bulk/` | POST | Bulk mark attendance | Supervisor+ |
| `/api/copies/` | GET | List correction copies | Corrector+ |
| `/api/corrections/` | POST | Submit a grade | Corrector+ |
| `/api/discrepancies/` | GET | List discrepancies | Coordinator+ |
| `/api/deliberation/ranking/` | GET | Anonymous ranking | Jury+ |
| `/api/deliberation/close_session/` | POST | Close deliberation | Jury+ |
| `/api/pv/generate/` | POST | Generate PV report | Jury+ |
| `/api/pv/{id}/sign/` | POST | Sign a PV | Jury+ |
| `/api/users/` | GET | List users | Admin |
| `/api/audit-logs/` | GET | View audit logs | Admin |

---

## User Roles

| Role | Permissions |
|---|---|
| **ADMIN** | Full access — user management, audit logs, system config |
| **CFD_HEAD** | Read-only oversight across all modules, signs final PVs |
| **COORDINATOR** | Manages sessions, candidates, anonymization, discrepancies |
| **CORRECTOR** | Views and grades assigned anonymous copies only |
| **SUPERVISOR** | Marks attendance (mobile PWA, offline-capable) |
| **JURY_MEMBER** | Views anonymous rankings, makes admission decisions, signs PVs |

---

## Testing

### Backend

```bash
python manage.py test
```

Quick manual check:

```python
import requests

response = requests.post("http://localhost:8000/api/auth/login/", json={
    "username": "admin@esi-sba.dz",
    "password": "Admin123!"
})
token = response.json()["access"]

candidates = requests.get(
    "http://localhost:8000/api/candidates/",
    headers={"Authorization": f"Bearer {token}"}
)
print(candidates.status_code)  # 200
```

### Frontend routes to verify

```
http://localhost:5173/                     Landing page
http://localhost:5173/login                Login
http://localhost:5173/app/dashboard        Dashboard
http://localhost:5173/app/candidates       Candidates
http://localhost:5173/app/planning         Planning
http://localhost:5173/app/attendance       Attendance (PWA)
http://localhost:5173/app/anonymization    Anonymization
http://localhost:5173/app/correction       Correction
http://localhost:5173/app/discrepancies    Discrepancies
http://localhost:5173/app/deliberation     Deliberation
http://localhost:5173/app/pv               PV Reports
http://localhost:5173/app/admin/users      User Management
http://localhost:5173/app/admin/audit      Audit Logs
http://localhost:5173/app/admin/settings   Settings
```

---

## Deployment

### Backend (Gunicorn + Nginx)

```bash
pip install gunicorn
python manage.py collectstatic
```

Create `/etc/systemd/system/concour-doctora.service`:

```ini
[Unit]
Description=CONCOUR DOCTORA Gunicorn Service
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/concour-doctora/backend
ExecStart=/path/to/venv/bin/gunicorn \
          --workers 3 \
          --bind unix:/path/to/concour-doctora/backend/concour-doctora.sock \
          concour_doctora.wsgi:application

[Install]
WantedBy=multi-user.target
```

Nginx config:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /static/ { root /path/to/backend; }
    location /media/  { root /path/to/backend; }

    location / {
        include proxy_params;
        proxy_pass http://unix:/path/to/backend/concour-doctora.sock;
    }
}
```

```bash
sudo systemctl enable --now concour-doctora
sudo ln -s /etc/nginx/sites-available/concour-doctora /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Frontend

```bash
cd frontend
npm run build
```

Serve the `dist/` folder with Nginx:

```nginx
server {
    listen 80;
    server_name app.your-domain.com;
    root /path/to/frontend/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `mysqlclient` install fails | Install system libs: `sudo apt-get install python3-dev default-libmysqlclient-dev build-essential` |
| Port 8000 already in use | `sudo lsof -i :8000` → `kill -9 <PID>`, or use `runserver 8001` |
| `No module named 'dotenv'` | `pip install python-dotenv` |
| CORS errors in browser | Add `http://localhost:5173` to `CORS_ALLOWED_ORIGINS` in `settings.py` |
| Migration errors | `rm db.sqlite3 && python manage.py migrate` |
| Python 3.13 issues | Use Python 3.10 or 3.11: `python3.10 -m venv venv` |
| Frontend won't start | `rm -rf node_modules package-lock.json && npm cache clean --force && npm install` |

---

## Contributing

### Workflow

```bash
# 1. Create a feature branch
git checkout -b feature/your-feature-name

# 2. Make and commit your changes
git add .
git commit -m "feat: describe your change"

# 3. Rebase on latest main before pushing
git fetch origin
git rebase origin/main

# 4. Push and open a Pull Request
git push origin feature/your-feature-name
```

### Commit convention

| Prefix | Use for |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Code restructuring |
| `test:` | Adding or updating tests |
| `chore:` | Build, tooling, dependencies |

### Code style

- **Python:** PEP 8, 4-space indent, docstrings on public functions
- **JavaScript/React:** ESLint config, 2-space indent, functional components with hooks

### Pull Request rules

- At least 2 reviewer approvals required
- Rebase (don't merge) before merging
- Squash commits on merge

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## Contact

**Mohamed Chaouch** — Project CHelaymi  
📧 ma.chaouch@esi-sba.dz  
🐙 [@chaouchmohamed](https://github.com/chaouchmohamed)  
🏫 École Supérieure d'Informatique de Sidi Bel Abbès (ESI-SBA)

---

<div align="center">
Made with ❤️ by Mouh el nigga  &nbsp;•&nbsp; © 2026 ESI-SBA
</div>
