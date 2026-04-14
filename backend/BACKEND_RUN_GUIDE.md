# ConcoursDoctor Backend — Setup Guide

Cross-platform setup guide for Linux, macOS, and Windows.

## Prerequisites

| Tool | Minimum Version | Install |
|---|---|---|
| Python | **3.12** | [python.org](https://www.python.org/downloads/) or see OS-specific instructions below |
| Docker + Docker Compose | Latest | [docker.com](https://docs.docker.com/get-docker/) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

### OS-Specific Python Install

**Ubuntu / Debian / Kali Linux:**
```bash
sudo apt update
sudo apt install python3.12 python3.12-venv python3.12-dev
```

**Fedora / RHEL:**
```bash
sudo dnf install python3.12 python3.12-devel
```

**macOS:**
```bash
brew install python@3.12
```

**Windows:**
- Download from [python.org](https://www.python.org/downloads/release/python-3120/)
- Check "Add python.exe to PATH" during install

### OS-Specific mysqlclient Build Deps

`mysqlclient` (the MySQL driver) requires C headers. Install these first:

**Ubuntu / Debian / Kali Linux:**
```bash
sudo apt install default-libmysqlclient-dev build-essential pkg-config
```

**Fedora / RHEL:**
```bash
sudo dnf install mysql-devel gcc pkg-config
```

**macOS:**
```bash
brew install mysql-client pkg-config
export PATH="/opt/homebrew/opt/mysql-client/bin:$PATH"
export LDFLAGS="-L/opt/homebrew/opt/mysql-client/lib"
export CPPFLAGS="-I/opt/homebrew/opt/mysql-client/include"
```
> Add the three `export` lines to your `~/.zshrc` or `~/.bashrc` to persist them.

**Windows:**
- The `mysqlclient` wheel is pre-compiled for Windows on PyPI — no extra steps needed.
- If pip fails to find a matching wheel, install [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/).

---

## Quick Start (5 Steps)

### 1. Clone and enter the backend directory

```bash
git clone <repo-url>
cd concour-doctora/backend
```

### 2. Prepare environment file

```bash
cp .env.example .env
```

> The defaults in `.env.example` work out-of-the-box with the Docker setup below.

### 3. Start infrastructure (MySQL + Redis)

```bash
docker compose up -d mysql redis
```

Wait for health checks to pass:
```bash
docker compose ps   # both should show "healthy"
```

### 4. Bootstrap the virtual environment

```bash
./scripts/bootstrap_venv.sh
```

This script:
- Looks for Python 3.12 on your system
- If not found, offers to install it automatically via [uv](https://docs.astral.sh/uv/)
- Creates `.venv/` and installs all dependencies
- Validates that `mysqlclient` can import (warns you if C deps are missing)

**Windows (PowerShell):**
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install --upgrade pip setuptools wheel
pip install -r requirements\base.txt
```

### 5. Run the backend

```bash
source .venv/bin/activate        # Windows: .venv\Scripts\Activate.ps1
python manage.py migrate --database=default
python manage.py migrate --database=anonymization
python manage.py generate_encryption_key
```

The `generate_encryption_key` command outputs a Fernet key. Add it to your `.env`:

```
ANONYMIZATION_ENCRYPTION_KEY=<paste-the-key-here>
```

Then create the admin and start the server:

```bash
python manage.py create_initial_admin --email admin@concours.local --password 'StrongPass123!'
python manage.py runserver
```

### Quick checks

```bash
curl -s http://127.0.0.1:8000/api/health/
curl -s http://127.0.0.1:8000/api/docs/
```

---

## Running Tests

```bash
source .venv/bin/activate
python manage.py test --settings=config.settings.test
```

Tests use SQLite (no MySQL needed), so they work even without Docker running.

---

## Useful Commands

### Stop infrastructure
```bash
docker compose down
```

### Reset databases (destroys data)
```bash
docker compose down -v
docker compose up -d mysql redis
```

### View infrastructure logs
```bash
docker compose logs -f mysql
docker compose logs -f redis
```

### Run Celery worker (for async tasks like email dispatch)
```bash
source .venv/bin/activate
celery -A config worker --loglevel=info
```

---

## Troubleshooting

### `Unknown server host 'mysql'`

You are running Django on the host machine but the `.env` has `DB_HOST=mysql` (a Docker-internal hostname).

**Fix:** Use `.env.example` defaults which set `DB_HOST=127.0.0.1`.

---

### `ModuleNotFoundError: No module named 'MySQLdb'`

The `mysqlclient` C extension failed to build. See [OS-Specific mysqlclient Build Deps](#os-specific-mysqlclient-build-deps) above.

After installing the OS packages, re-run:
```bash
source .venv/bin/activate
pip install --force-reinstall mysqlclient
```

---

### `python3.12: command not found`

Python 3.12 is not installed or not on PATH.

**Option A:** Install via your OS package manager (see table above).

**Option B:** Let the bootstrap script install it via `uv`:
```bash
# Install uv first
curl -LsSf https://astral.sh/uv/install.sh | sh   # Linux/macOS
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"   # Windows

# Then run bootstrap (it will download Python 3.12 via uv)
./scripts/bootstrap_venv.sh
```

---

### Port 3306 or 6379 already in use

Another MySQL or Redis instance is running on the host.

**Fix:** Stop the conflicting service, or change the mapped ports in `docker-compose.yml`:
```yaml
ports:
  - "13306:3306"    # MySQL on localhost:13306
  - "16379:6379"    # Redis on localhost:16379
```
Then update `.env` accordingly (`DB_PORT=13306`, etc.).

---

### Windows: `.\scripts\bootstrap_venv.sh` not recognized

The bootstrap script is Bash-only. On Windows, use PowerShell steps from Step 4 above, or run via WSL:
```bash
wsl
./scripts/bootstrap_venv.sh
```

---

## Dependency Versions

Current production dependencies (pinned in `requirements/base.txt`):

| Package | Version Range | Purpose |
|---|---|---|
| Django | 6.0.x | Web framework |
| djangorestframework | 3.15+ | REST API |
| djangorestframework-simplejwt | 5.5+ | JWT auth |
| drf-spectacular | 0.29.x | OpenAPI/Swagger |
| bcrypt | 4.1–4.x | Password hashing |
| mysqlclient | 2.2.x | MySQL driver |
| celery | 5.3+ | Async task queue |
| redis | 5.x | Celery broker (compatible with Celery 5) |
| openpyxl | 3.1.x | Excel file import |
