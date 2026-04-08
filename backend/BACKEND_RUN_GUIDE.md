# BACKEND_RUN_GUIDE

This is the latest and only recommended local workflow.
Extended documentation is available in `docs/README.md`.

## Goal

- Use Docker for infrastructure only: `mysql` + `redis`
- Ensure local Python `3.14` is available (auto-download if missing)
- Create `.venv` and install backend requirements
- Run backend with normal local Python commands (`python manage.py ...`)

## 1) Prepare env

```bash
cp .env.example .env
```

## 2) Start infrastructure

```bash
docker compose up -d mysql redis
```

## 3) Bootstrap local virtualenv

```bash
./scripts/bootstrap_venv.sh
```

This script enforces Python `3.14`:
- If you already have Python `3.14`, it uses it directly.
- If you do not have Python `3.14`, it installs/downloads it automatically via `uv`, then creates `.venv`.

## 4) Run backend locally (normal Python)

```bash
source .venv/bin/activate
python manage.py migrate --database=default
python manage.py migrate --database=anonymization
python manage.py create_initial_admin --email admin@concours.local --password 'StrongPass123!'
python manage.py runserver
```

## 5) Quick checks

```bash
curl -s http://127.0.0.1:8000/api/health/
curl -s http://127.0.0.1:8000/api/docs/
```

## Useful commands

### Stop infra

```bash
docker compose down
```

### Reset infra and DB volumes

```bash
docker compose down -v
docker compose up -d mysql redis
```

### Infra logs

```bash
docker compose logs -f mysql
docker compose logs -f redis
```

## Troubleshooting

### `Unknown server host 'mysql'`

You are running Django on host with Docker-only DB hostname settings.

Use `.env.example` values (`DB_HOST=127.0.0.1`, `ANON_DB_HOST=127.0.0.1`) and run local Python commands as shown above.
