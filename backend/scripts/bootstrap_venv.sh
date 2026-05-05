#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REQUIRED_PY_MM="${REQUIRED_PY_MM:-3.12}"

detect_os() {
  local uname_out
  uname_out="$(uname -s 2>/dev/null || echo "Unknown")"
  case "$uname_out" in
    Linux*)  echo "Linux" ;;
    Darwin*) echo "macOS" ;;
    *)       echo "Unknown" ;;
  esac
}

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

check_mysqlclient_deps() {
  local os
  os="$(detect_os)"

  if .venv/bin/python -c "import MySQLdb" 2>/dev/null; then
    return 0
  fi

  echo
  echo "WARNING: mysqlclient failed to import (likely missing C build deps)."
  case "$os" in
    Linux)
      echo "  Install with:"
      echo "    sudo apt-get install python3-dev default-libmysqlclient-dev build-essential  # Debian/Ubuntu"
      echo "    sudo dnf install python3-devel mysql-devel gcc                              # Fedora/RHEL"
      ;;
    macOS)
      echo "  Install with:"
      echo "    brew install mysql-client pkg-config"
      echo "    export PATH=\"/opt/homebrew/opt/mysql-client/bin:\$PATH\""
      echo "    export LDFLAGS=\"-L/opt/homebrew/opt/mysql-client/lib\""
      echo "    export CPPFLAGS=\"-I/opt/homebrew/opt/mysql-client/include\""
      ;;
  esac
  echo "  Then re-run: ./scripts/bootstrap_venv.sh"
  echo
  return 1
}

echo "=== ConcoursDoctor Backend Bootstrap ==="
echo "Target Python: ${REQUIRED_PY_MM}"
echo

if PYTHON_CMD="$(find_matching_python)"; then
  echo "Found local Python: $("$PYTHON_CMD" --version)"
  "$PYTHON_CMD" -m venv --clear .venv
  # shellcheck disable=SC1091
  source .venv/bin/activate
  python -m pip install --upgrade pip setuptools wheel
  python -m pip install -r requirements/base.txt
else
  echo "Python ${REQUIRED_PY_MM} not found locally."
  echo
  echo "Options:"
  echo "  1. Install Python ${REQUIRED_PY_MM} manually:"
  echo "     - Linux:   sudo apt install python3.12 python3.12-venv python3.12-dev"
  echo "     - macOS:   brew install python@3.12"
  echo "     - Windows: https://www.python.org/downloads/"
  echo
  echo "  2. Or let uv download it automatically..."
  echo

  install_uv

  echo "Installing Python ${REQUIRED_PY_MM} via uv..."
  uv python install "$REQUIRED_PY_MM"
  uv venv --python "$REQUIRED_PY_MM" --clear .venv
  # shellcheck disable=SC1091
  source .venv/bin/activate
  uv pip install -r requirements/base.txt
fi

if check_mysqlclient_deps; then
  echo
  echo "=== Bootstrap Complete ==="
  echo
  echo "Next steps:"
  echo "  1. source .venv/bin/activate"
  echo "  2. cp .env.example .env   (if not done already)"
  echo "  3. docker compose up -d mysql redis"
  echo "  4. python manage.py migrate --database=default"
  echo "  5. python manage.py migrate --database=anonymization"
  echo "  6. python manage.py create_initial_admin --email admin@concours.local --password 'StrongPass123!'"
  echo "  7. python manage.py runserver"
else
  echo
  echo "=== Bootstrap partially complete ==="
  echo "mysqlclient is not working. Follow the instructions above and re-run."
fi
