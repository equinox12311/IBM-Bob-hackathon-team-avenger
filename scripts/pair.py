#!/usr/bin/env python3
"""One-click pairing — print a QR code the mobile app can scan.

Usage:
    make pair

What it does:
  1. Reads DIARY_TOKEN from `.env` (or uses `--token` if you pass one).
  2. Detects this Mac's LAN IP (or honours `--ip <addr>`).
  3. Encodes a JSON payload as a QR and prints it as ASCII so you can
     hold the terminal up to your phone.

The mobile app's Settings → Connection has a "Scan to connect" button
that consumes the same JSON shape and writes it straight into
AsyncStorage — no copy-paste, no fat-fingering tokens.
"""

from __future__ import annotations

import argparse
import json
import os
import socket
import sys
from pathlib import Path

try:
    import qrcode  # type: ignore[import-not-found]
except ImportError:
    sys.exit(
        "qrcode is not installed. Run: pip install -r src/cortex-api/requirements.txt"
    )


REPO_ROOT = Path(__file__).resolve().parent.parent


def detect_lan_ip() -> str:
    """Best-effort LAN IP detection.

    We open a UDP socket to a public address (no packet is actually sent)
    and read back the local interface's IP. Falls back to 127.0.0.1.
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def read_token_from_env() -> str:
    env_path = REPO_ROOT / ".env"
    if not env_path.exists():
        return ""
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line.startswith("DIARY_TOKEN="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ip", help="Override LAN IP (default: auto-detected)")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--token", help="Override token (default: from .env)")
    parser.add_argument("--scheme", default="http", choices=["http", "https"])
    args = parser.parse_args()

    ip = args.ip or detect_lan_ip()
    token = args.token or read_token_from_env() or os.environ.get("DIARY_TOKEN", "")

    if not token:
        print(
            "❌  No token. Add DIARY_TOKEN=… to .env or pass --token <value>.",
            file=sys.stderr,
        )
        return 1

    payload = {
        "v": 1,
        "url": f"{args.scheme}://{ip}:{args.port}",
        "token": token,
    }
    encoded = json.dumps(payload, separators=(",", ":"))

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=1,
        border=2,
    )
    qr.add_data(encoded)
    qr.make(fit=True)

    print()
    print(f"  cortex pairing")
    print(f"  ───────────────")
    print(f"  url:   {payload['url']}")
    print(f"  token: {token[:6]}…{token[-4:] if len(token) > 10 else ''}")
    print()
    qr.print_ascii(invert=True)
    print()
    print("  Open the Cortex app → Settings → Scan to connect.")
    print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
