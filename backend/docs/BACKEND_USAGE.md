# Backend Usage Manual

This document explains exactly how to run and operate the backend locally.

## 1. What this backend currently is

- Django + DRF skeleton for ConcoursDoctor
- MySQL + Redis dependencies
- JWT auth with role-based access scaffolding
- OpenAPI docs available
- Many endpoints are scaffolds and return minimal behavior

## 2. Prerequisites

- Docker + Docker Compose
- `python3` command available
- Internet access for first dependency install

## 3. First-time setup

### 3.1 Create `.env`

```bash
cp .env.example .env
```

### 3.2 Start infrastructure (MySQL, Redis)

```bash
docker compose up -d mysql redis
```

### 3.3 Create `.venv` and install Python dependencies

```bash
./scripts/bootstrap_venv.sh
```

What the script does:
- enforces Python 3.14
- uses local Python 3.14 if present
- otherwise installs Python 3.14 via `uv`
- creates `.venv`
- installs `requirements/base.txt`

### 3.4 Run migrations

```bash
source .venv/bin/activate
python manage.py migrate --database=default
python manage.py migrate --database=anonymization
```

### 3.5 Create initial admin

```bash
python manage.py create_initial_admin --email admin@concours.local --password 'StrongPass123!'
```

### 3.6 Start backend

```bash
python manage.py runserver
```

## 4. Access points

- Root: `http://127.0.0.1:8000/` (redirects to Swagger)
- Swagger UI: `http://127.0.0.1:8000/api/docs/`
- OpenAPI schema: `http://127.0.0.1:8000/api/schema/`
- Health: `http://127.0.0.1:8000/api/health/`

## 5. Useful operational commands

### Stop infra

```bash
docker compose down
```

### Reset infra databases

```bash
docker compose down -v
docker compose up -d mysql redis
```

### Infra logs

```bash
docker compose logs -f mysql
docker compose logs -f redis
```

### Run any management command

```bash
source .venv/bin/activate
python manage.py <command>
```

## 6. Common issues

### `Unknown server host 'mysql'`

Cause:
- backend is run locally (host), but `.env` uses Docker internal hostnames.

Fix:
- keep `.env` aligned with `.env.example`
- use `DB_HOST=127.0.0.1` and `ANON_DB_HOST=127.0.0.1`

### `Couldn't load 'BCryptSHA256PasswordHasher' ... No module named 'bcrypt'`

Fix:
```bash
source .venv/bin/activate
pip install -r requirements/base.txt
```

### MySQL migrations fail due stale volume

Fix:
```bash
docker compose down -v
docker compose up -d mysql redis
source .venv/bin/activate
python manage.py migrate --database=default
python manage.py migrate --database=anonymization
```
