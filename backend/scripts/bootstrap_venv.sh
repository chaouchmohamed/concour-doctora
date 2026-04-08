#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REQUIRED_PY_MM="${REQUIRED_PY_MM:-3.14}"

find_matching_python() {
  if command -v "python${REQUIRED_PY_MM}" >/dev/null 2>&1; then
    echo "python${REQUIRED_PY_MM}"
    return 0
  fi

  if command -v python3 >/dev/null 2>&1; then
    local py3_mm
    py3_mm="$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
    if [ "$py3_mm" = "$REQUIRED_PY_MM" ]; then
      echo "python3"
      return 0
    fi
  fi

  return 1
}

install_uv() {
  if command -v uv >/dev/null 2>&1; then
    return 0
  fi

  echo "uv not found. Installing uv..."
  if command -v curl >/dev/null 2>&1; then
    curl -LsSf https://astral.sh/uv/install.sh | sh
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- https://astral.sh/uv/install.sh | sh
  else
    echo "Error: neither curl nor wget is available to install uv."
    exit 1
  fi

  export PATH="$HOME/.local/bin:$PATH"
  if ! command -v uv >/dev/null 2>&1; then
    echo "Error: uv installation failed."
    exit 1
  fi
}

if PYTHON_CMD="$(find_matching_python)"; then
  echo "Found local Python: $("$PYTHON_CMD" --version)"
  "$PYTHON_CMD" -m venv --clear .venv
  # shellcheck disable=SC1091
  source .venv/bin/activate
  python -m pip install --upgrade pip setuptools wheel
  python -m pip install -r requirements/base.txt
else
  echo "Python ${REQUIRED_PY_MM} not found locally."
  echo "Downloading/installing Python ${REQUIRED_PY_MM} with uv..."
  install_uv

  uv python install "$REQUIRED_PY_MM"
  uv venv --python "$REQUIRED_PY_MM" --clear .venv
  uv pip install --python .venv/bin/python -r requirements/base.txt
fi

echo
echo "Done. Next commands:"
echo "source .venv/bin/activate"
echo "python manage.py migrate --database=default"
echo "python manage.py migrate --database=anonymization"
echo "python manage.py runserver"
