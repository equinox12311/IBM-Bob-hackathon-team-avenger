#!/usr/bin/env bash
# Cortex one-command boot. Idempotent — safe to run any time.
#
#   make start
#
# Does whatever's needed:
#   1. .venv + Python deps     (cortex-api)
#   2. .env with a DIARY_TOKEN (auto-generated if absent)
#   3. cortex-mobile/node_modules (npm install --legacy-peer-deps)
#   4. Starts the FastAPI server on :8080 in the background
#   5. Waits until /health responds
#   6. Prints the pairing QR (scripts/pair.py)
#   7. Starts the Expo dev server in the foreground
#
# Ctrl-C in Expo cleanly stops the API server.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

API_PORT="${API_PORT:-8080}"
VENV_DIR="$REPO_ROOT/.venv"
PY="$VENV_DIR/bin/python"
PIP="$VENV_DIR/bin/pip"
MOBILE_DIR="$REPO_ROOT/cortex-mobile"
LOG_DIR="$REPO_ROOT/.logs"
API_LOG="$LOG_DIR/api.log"
API_PIDFILE="$LOG_DIR/api.pid"

mkdir -p "$LOG_DIR"

# ── ANSI helpers ─────────────────────────────────────────────────────────────
b() { printf '\033[1m%s\033[0m\n' "$*"; }
dim() { printf '\033[2m%s\033[0m\n' "$*"; }
ok() { printf '\033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '\033[33m!\033[0m %s\n' "$*"; }

# ── 1. Python venv + cortex-api deps ─────────────────────────────────────────
ensure_python() {
  if [ ! -x "$PY" ]; then
    b "▶ Creating Python venv at .venv/"
    python3 -m venv "$VENV_DIR"
  fi

  # Quick check: is fastapi already installed?
  if "$PY" -c "import fastapi, croniter, qrcode" 2>/dev/null; then
    ok "Python deps present"
    return
  fi

  b "▶ Installing Python deps for cortex-api"
  "$PIP" install --upgrade pip --quiet
  "$PIP" install --quiet -r "$REPO_ROOT/src/cortex-api/requirements.txt"
  ok "Python deps installed"
}

# ── 2. .env with DIARY_TOKEN ─────────────────────────────────────────────────
ensure_env() {
  local env="$REPO_ROOT/.env"
  if [ ! -f "$env" ]; then
    b "▶ Bootstrapping .env"
    cat >"$env" <<EOF
LLM_PROVIDER=local
EMBEDDINGS_PROVIDER=local
DIARY_DB_PATH=data/cortex.db
RELOAD=false
EOF
  fi
  if ! grep -q '^DIARY_TOKEN=' "$env"; then
    local tok
    tok="$(LC_ALL=C tr -dc 'a-zA-Z0-9' </dev/urandom | head -c 40)"
    printf '\nDIARY_TOKEN=%s\n' "$tok" >>"$env"
    ok "Generated DIARY_TOKEN"
  fi
  mkdir -p "$REPO_ROOT/data"
  ok ".env ready"
}

# ── 3. Mobile deps ───────────────────────────────────────────────────────────
ensure_mobile() {
  if [ ! -d "$MOBILE_DIR/node_modules" ] || [ ! -x "$MOBILE_DIR/node_modules/.bin/expo" ]; then
    b "▶ Installing cortex-mobile deps (npm install)"
    (cd "$MOBILE_DIR" && npm install --legacy-peer-deps --no-audit --no-fund)
  fi
  ok "Mobile deps present"
}

# ── 4. Start API in background ──────────────────────────────────────────────
start_api() {
  # If something's already listening on the port, assume we're good.
  if curl -sSf "http://127.0.0.1:$API_PORT/health" >/dev/null 2>&1; then
    ok "API already running on :$API_PORT"
    return
  fi

  b "▶ Starting cortex-api on :$API_PORT (logs → .logs/api.log)"
  (
    cd "$REPO_ROOT"
    set -a; . "$REPO_ROOT/.env"; set +a
    nohup "$PY" -m uvicorn cortex_api.server:app \
      --host 0.0.0.0 --port "$API_PORT" \
      --app-dir "$REPO_ROOT/src/cortex-api" \
      >"$API_LOG" 2>&1 &
    echo $! >"$API_PIDFILE"
  )

  # Wait up to 30s for /health
  for i in $(seq 1 30); do
    if curl -sSf "http://127.0.0.1:$API_PORT/health" >/dev/null 2>&1; then
      ok "API up (PID $(cat "$API_PIDFILE"))"
      return
    fi
    sleep 1
  done
  warn "API didn't respond within 30s — check $API_LOG"
  return 1
}

# ── 5. Cleanup on exit ───────────────────────────────────────────────────────
cleanup() {
  if [ -f "$API_PIDFILE" ]; then
    local pid
    pid="$(cat "$API_PIDFILE")"
    if kill -0 "$pid" 2>/dev/null; then
      dim "↳ stopping API (PID $pid)"
      kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$API_PIDFILE"
  fi
}
trap cleanup EXIT INT TERM

# ── 6. Print pairing QR ──────────────────────────────────────────────────────
print_qr() {
  "$PY" "$REPO_ROOT/scripts/pair.py" --port "$API_PORT" || true
}

# ── 7. Start Expo (foreground) ───────────────────────────────────────────────
start_expo() {
  local lan_ip
  lan_ip="$( "$PY" -c 'import socket;s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM);s.connect(("8.8.8.8",80));print(s.getsockname()[0])' 2>/dev/null || echo '127.0.0.1' )"
  b "▶ Starting Expo (LAN host: $lan_ip)"
  echo
  echo "  Open Cortex → Settings → Scan to connect, then aim at the QR above."
  echo
  cd "$MOBILE_DIR"
  REACT_NATIVE_PACKAGER_HOSTNAME="$lan_ip" \
    npx expo start --clear
}

# ── Run ──────────────────────────────────────────────────────────────────────
b "Cortex · one-command boot"
echo

ensure_python
ensure_env
ensure_mobile
start_api
print_qr
start_expo
