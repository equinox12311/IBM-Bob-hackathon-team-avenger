#!/usr/bin/env python3
"""Cortex one-command boot — cross-platform (macOS / Linux / Windows).

Usage:
    python3 scripts/start.py
    make start             # via Makefile
    .\\start.bat            # Windows cmd shim
    .\\start.ps1            # Windows PowerShell shim

Idempotent. Does whatever's missing:
  1. Python venv at .venv/ + cortex-api deps
  2. .env with a generated DIARY_TOKEN
  3. cortex-mobile/node_modules (npm install --legacy-peer-deps)
  4. Starts FastAPI on :8080 in the background
  5. Waits for /health
  6. Prints the pairing QR + step-by-step phone instructions
  7. Starts the Expo dev server in the foreground

Ctrl-C in Expo cleanly stops the API server.
"""

from __future__ import annotations

import atexit
import os
import platform
import secrets
import shutil
import signal
import socket
import string
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

# ─── Paths ────────────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parent.parent
VENV_DIR = REPO_ROOT / ".venv"
MOBILE_DIR = REPO_ROOT / "cortex-mobile"
LOG_DIR = REPO_ROOT / ".logs"
API_LOG = LOG_DIR / "api.log"
API_PIDFILE = LOG_DIR / "api.pid"
API_PORT = int(os.environ.get("API_PORT", "8080"))
IS_WIN = platform.system() == "Windows"

# Python + pip executables inside the venv
VENV_BIN = VENV_DIR / ("Scripts" if IS_WIN else "bin")
VENV_PY = VENV_BIN / ("python.exe" if IS_WIN else "python")
VENV_PIP = VENV_BIN / ("pip.exe" if IS_WIN else "pip")


# ─── Pretty output ────────────────────────────────────────────────────────────

def _supports_color() -> bool:
    if IS_WIN and not os.environ.get("WT_SESSION"):
        return False
    return sys.stdout.isatty()


_COLOR = _supports_color()


def b(msg: str) -> None:
    print(f"\033[1m{msg}\033[0m" if _COLOR else msg)


def dim(msg: str) -> None:
    print(f"\033[2m{msg}\033[0m" if _COLOR else msg)


def ok(msg: str) -> None:
    prefix = "\033[32m✓\033[0m" if _COLOR else "✓"
    print(f"{prefix} {msg}")


def warn(msg: str) -> None:
    prefix = "\033[33m!\033[0m" if _COLOR else "!"
    print(f"{prefix} {msg}")


def fatal(msg: str, code: int = 1) -> None:
    prefix = "\033[31m✗\033[0m" if _COLOR else "✗"
    print(f"{prefix} {msg}", file=sys.stderr)
    sys.exit(code)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def run(cmd: list[str], **kw) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, check=True, text=True, **kw)


def lan_ip() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def health_ok(port: int) -> bool:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=2) as r:
            return r.status == 200
    except (urllib.error.URLError, ConnectionError, TimeoutError, OSError):
        return False


# ─── 1. Python venv + deps ────────────────────────────────────────────────────

def ensure_python() -> None:
    if not VENV_PY.exists():
        b("▶ Creating Python venv at .venv/")
        run([sys.executable, "-m", "venv", str(VENV_DIR)])

    # Quick check: are core deps already installed?
    check = subprocess.run(
        [str(VENV_PY), "-c", "import fastapi, croniter, qrcode"],
        capture_output=True,
    )
    if check.returncode == 0:
        ok("Python deps present")
        return

    b("▶ Installing Python deps for cortex-api")
    run([str(VENV_PIP), "install", "--upgrade", "pip", "--quiet"])
    run([
        str(VENV_PIP), "install", "--quiet",
        "-r", str(REPO_ROOT / "src" / "cortex-api" / "requirements.txt"),
    ])
    ok("Python deps installed")


# ─── 2. .env with DIARY_TOKEN ─────────────────────────────────────────────────

def ensure_env() -> None:
    env_path = REPO_ROOT / ".env"
    # Default to `fake` embeddings — instant boot, no 90-second sentence-
    # transformers cold-start (the demo doesn't need real vector quality
    # to show every UI surface). Override with EMBEDDINGS_PROVIDER=local or
    # =watsonx in .env when you actually need it.
    gguf = REPO_ROOT / "models" / "granite-3.1-2b-instruct-Q4_K_M.gguf"
    llm_provider = "local" if gguf.exists() else "off"
    if not env_path.exists():
        b("▶ Bootstrapping .env")
        env_path.write_text(
            f"LLM_PROVIDER={llm_provider}\n"
            "EMBEDDINGS_PROVIDER=fake\n"
            "DIARY_DB_PATH=data/cortex.db\n"
            "RELOAD=false\n"
            "HF_HUB_OFFLINE=1\n"
        )
    text = env_path.read_text()
    if "DIARY_TOKEN=" not in text:
        token = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(40))
        with env_path.open("a") as f:
            if not text.endswith("\n"):
                f.write("\n")
            f.write(f"DIARY_TOKEN={token}\n")
        ok("Generated DIARY_TOKEN")
    # If the GGUF showed up after first boot, flip LLM_PROVIDER on automatically.
    text = env_path.read_text()
    if gguf.exists() and "LLM_PROVIDER=off" in text:
        env_path.write_text(text.replace("LLM_PROVIDER=off", "LLM_PROVIDER=local"))
        ok("Local Granite GGUF detected — flipping LLM_PROVIDER=local")
        text = env_path.read_text()
    # Migrate legacy .env files that still default to the slow sentence-
    # transformers boot. We default to `fake` for the demo path; users who
    # need real semantic search can put EMBEDDINGS_PROVIDER=watsonx (or
    # local, knowing it costs ~90s of cold start) themselves.
    if "EMBEDDINGS_PROVIDER=local" in text:
        env_path.write_text(text.replace("EMBEDDINGS_PROVIDER=local", "EMBEDDINGS_PROVIDER=fake"))
        ok("Migrated EMBEDDINGS_PROVIDER=local → fake (instant boot)")
        text = env_path.read_text()
    # Belt-and-braces: ensure HF_HUB_OFFLINE=1 is set so any stray
    # huggingface call doesn't stall startup behind a DNS check.
    if "HF_HUB_OFFLINE=" not in text:
        with env_path.open("a") as f:
            if not text.endswith("\n"):
                f.write("\n")
            f.write("HF_HUB_OFFLINE=1\n")
        ok("Added HF_HUB_OFFLINE=1 to .env")
    (REPO_ROOT / "data").mkdir(exist_ok=True)
    ok(".env ready")


# ─── 3. Mobile deps ───────────────────────────────────────────────────────────

def ensure_mobile() -> None:
    expo_bin = MOBILE_DIR / "node_modules" / ".bin" / ("expo.cmd" if IS_WIN else "expo")
    if expo_bin.exists():
        ok("Mobile deps present")
        return
    if not shutil.which("npm"):
        fatal("npm is required (install Node.js from https://nodejs.org/).")
    b("▶ Installing cortex-mobile deps (this can take a minute)")
    run(
        ["npm", "install", "--legacy-peer-deps", "--no-audit", "--no-fund"],
        cwd=str(MOBILE_DIR),
        shell=IS_WIN,
    )
    ok("Mobile deps installed")


# ─── 4. Start API in background ──────────────────────────────────────────────

_api_proc: subprocess.Popen | None = None


def start_api() -> None:
    global _api_proc

    if health_ok(API_PORT):
        ok(f"API already running on :{API_PORT}")
        return

    LOG_DIR.mkdir(exist_ok=True)
    b(f"▶ Starting cortex-api on :{API_PORT} (logs → .logs/api.log)")

    # Load .env into environment so settings pick it up
    env = os.environ.copy()
    for line in (REPO_ROOT / ".env").read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")

    api_log_f = open(API_LOG, "w")
    cmd = [
        str(VENV_PY), "-m", "uvicorn", "cortex_api.server:app",
        "--host", "0.0.0.0",
        "--port", str(API_PORT),
        "--app-dir", str(REPO_ROOT / "src" / "cortex-api"),
    ]

    creationflags = 0
    if IS_WIN:
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP  # type: ignore[attr-defined]

    _api_proc = subprocess.Popen(
        cmd,
        stdout=api_log_f,
        stderr=subprocess.STDOUT,
        cwd=str(REPO_ROOT),
        env=env,
        creationflags=creationflags,
    )
    API_PIDFILE.write_text(str(_api_proc.pid))

    # Wait up to 120s for /health — Granite GGUF cold-load can take ~60s
    # on first boot. Print progress every 10s so the user knows we're alive.
    for i in range(120):
        if health_ok(API_PORT):
            ok(f"API up (PID {_api_proc.pid})")
            return
        if _api_proc.poll() is not None:
            warn(f"API process exited early — check {API_LOG}")
            return
        if i and i % 10 == 0:
            dim(f"  still loading… ({i}s)")
        time.sleep(1)
    warn(f"API didn't respond within 120s — check {API_LOG}")


def cleanup() -> None:
    global _api_proc
    if _api_proc and _api_proc.poll() is None:
        dim(f"↳ stopping API (PID {_api_proc.pid})")
        try:
            if IS_WIN:
                _api_proc.send_signal(signal.CTRL_BREAK_EVENT)  # type: ignore[attr-defined]
            else:
                _api_proc.terminate()
            try:
                _api_proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                _api_proc.kill()
        except Exception:
            pass
    if API_PIDFILE.exists():
        API_PIDFILE.unlink()


atexit.register(cleanup)
signal.signal(signal.SIGINT, lambda *_: sys.exit(130))
signal.signal(signal.SIGTERM, lambda *_: sys.exit(143))


# ─── 5. Pairing QR + instructions ─────────────────────────────────────────────

def print_pairing_qr() -> None:
    print()
    b("Pair your phone")
    print()
    print("  1. Install Expo Go on your phone:")
    print("       iOS     → https://apps.apple.com/app/expo-go/id982107779")
    print("       Android → https://play.google.com/store/apps/details?id=host.exp.exponent")
    print()
    print("  2. When the Expo dev server starts below, scan its QR with:")
    print("       iOS     → built-in Camera app")
    print("       Android → Expo Go app (Scan QR Code)")
    print()
    print("  3. Inside the Cortex app: Settings → Scan to connect")
    print("     then point your phone at THIS QR:")
    print()
    try:
        run([str(VENV_PY), str(REPO_ROOT / "scripts" / "pair.py"), "--port", str(API_PORT)])
    except subprocess.CalledProcessError as e:
        warn(f"Couldn't render the pairing QR ({e}). Run `make pair` separately.")


# ─── 6. Start Expo (foreground) ───────────────────────────────────────────────

def start_expo() -> None:
    ip = lan_ip()
    b(f"▶ Starting Expo (LAN host {ip})")
    print()
    print("  Press q in Expo to quit, or Ctrl-C in this terminal.")
    print()

    env = os.environ.copy()
    env["REACT_NATIVE_PACKAGER_HOSTNAME"] = ip

    cmd = ["npx", "expo", "start", "--clear"]
    try:
        subprocess.run(cmd, cwd=str(MOBILE_DIR), env=env, check=False, shell=IS_WIN)
    except KeyboardInterrupt:
        pass


# ─── Entrypoint ───────────────────────────────────────────────────────────────

def main() -> int:
    b("Cortex · one-command boot")
    print()

    ensure_python()
    ensure_env()
    ensure_mobile()
    start_api()
    print_pairing_qr()
    start_expo()
    return 0


if __name__ == "__main__":
    sys.exit(main())
