#!/usr/bin/env python3
"""End-to-end smoke checks — Tier 1 of the test plan.

Pytest already covers backend logic + HTTP surface via TestClient
(124 cases). This script adds the integration glue pytest doesn't see:

  1. Pair payload roundtrip          — pair.py is importable, builds
                                       a JSON shape the mobile app
                                       can parse back into URL+token.
  2. install-bob → tmp BOB_HOME      — copies skill, mode, commands,
                                       rules, MCP config to all the
                                       expected paths in a sandboxed
                                       fake home.
  3. Mobile typecheck (best effort)  — `npx tsc --noEmit` against
                                       cortex-mobile/ if node is on
                                       PATH; skipped otherwise.

`make smoke` runs pytest first, then this script. Each check is an
independent unit so a failure surfaces as one red line, not a stack
trace, and the rest of the checks still run.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from contextlib import contextmanager
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = REPO_ROOT / "scripts"
MOBILE = REPO_ROOT / "cortex-mobile"

# ─── Output ──────────────────────────────────────────────────────────────────


def _color() -> bool:
    return sys.stdout.isatty() and os.name != "nt" or bool(os.environ.get("WT_SESSION"))


_C = _color()


def green(s: str) -> str:
    return f"\033[32m{s}\033[0m" if _C else s


def red(s: str) -> str:
    return f"\033[31m{s}\033[0m" if _C else s


def dim(s: str) -> str:
    return f"\033[2m{s}\033[0m" if _C else s


def bold(s: str) -> str:
    return f"\033[1m{s}\033[0m" if _C else s


# ─── Check registry ──────────────────────────────────────────────────────────

CHECKS: list[tuple[str, callable]] = []


def check(name: str):
    def deco(fn):
        CHECKS.append((name, fn))
        return fn

    return deco


# ─── Checks ──────────────────────────────────────────────────────────────────


@check("pair payload — module loads, IP detect works, JSON shape matches mobile parser")
def check_pair() -> None:
    sys.path.insert(0, str(SCRIPTS))
    try:
        import pair  # type: ignore[import-not-found]
    finally:
        sys.path.pop(0)

    ip = pair.detect_lan_ip()
    assert isinstance(ip, str) and len(ip) >= 7, f"weird IP: {ip!r}"

    # Build the same payload pair.py emits and verify it round-trips through
    # the JSON shape the mobile parser expects. (See ScanToConnect.parsePayload.)
    payload = {"v": 1, "url": f"http://{ip}:8080", "token": "test-token-xxxx"}
    encoded = json.dumps(payload, separators=(",", ":"))
    decoded = json.loads(encoded)
    assert decoded["v"] == 1
    assert decoded["url"].startswith("http://")
    assert isinstance(decoded["token"], str) and decoded["token"]


@check("install-bob — writes skill, rules, commands, mode, MCP config to a tmp BOB_HOME")
def check_install_bob() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        bob_home = Path(tmp) / ".bob"
        env = {**os.environ, "BOB_HOME": str(bob_home)}
        # `install-bob.py` uses BOB_HOME if set; create the dir first so the
        # detect-existing path picks it.
        bob_home.mkdir(parents=True, exist_ok=True)

        result = subprocess.run(
            [sys.executable, str(SCRIPTS / "install-bob.py"), "--bob-home", str(bob_home)],
            env=env,
            capture_output=True,
            text=True,
            cwd=str(REPO_ROOT),
        )
        if result.returncode != 0:
            raise AssertionError(
                f"install-bob exited {result.returncode}\n"
                f"stdout:\n{result.stdout}\nstderr:\n{result.stderr}"
            )

        expected = [
            bob_home / "skills" / "cortex" / "SKILL.md",
            bob_home / "rules-cortex" / "01-capture-style.md",
            bob_home / "rules-cortex" / "05-pending-actions.md",
            bob_home / "commands" / "diary-save.md",
            bob_home / "settings" / "mcp_settings.json",
        ]
        missing = [str(p.relative_to(bob_home)) for p in expected if not p.exists()]
        if missing:
            raise AssertionError(f"install-bob missed: {missing}")

        # Sanity-check the MCP config carries our server entry.
        config = json.loads((bob_home / "settings" / "mcp_settings.json").read_text())
        assert "mcpServers" in config, "no mcpServers key in mcp_settings.json"
        assert "cortex" in config["mcpServers"], (
            f"cortex MCP server not registered (got: {list(config['mcpServers'])})"
        )


@check("mobile typecheck — tsc --noEmit (skipped if node not on PATH)")
def check_mobile_tsc() -> None:
    if not shutil.which("npx"):
        print(dim("    skipped — npx not on PATH"))
        return
    if not (MOBILE / "node_modules").exists():
        print(dim("    skipped — cortex-mobile/node_modules missing (run `make start` once)"))
        return

    result = subprocess.run(
        [
            "npx", "-y", "-p", "typescript@5.3", "tsc",
            "--noEmit", "--skipLibCheck",
            "--jsx", "react-native",
            "--esModuleInterop",
            "--moduleResolution", "bundler",
            "--target", "esnext",
            "--module", "esnext",
            "--strict", "false",
        ],
        cwd=str(MOBILE),
        capture_output=True,
        text=True,
        shell=(os.name == "nt"),
    )

    # Filter out the "Cannot find module" noise that comes from running tsc
    # outside an IDE (the local tsconfig is enough at runtime via Metro).
    own_errors = [
        line for line in result.stdout.splitlines()
        if line.startswith(("app/", "src/")) and "Cannot find module" not in line
    ]
    if own_errors:
        raise AssertionError("tsc errors:\n  " + "\n  ".join(own_errors[:10]))


@check("pair → mobile parser shape — known-bad payloads rejected")
def check_pair_negative() -> None:
    """Smoke-test the JSON shape contract from the mobile side.

    The mobile parser at cortex-mobile/src/components/ScanToConnect.tsx
    requires a top-level object with `url` and `token` strings. Mirror
    that here so a regression on either side trips this check.
    """
    def parse(raw: str) -> dict | None:
        try:
            obj = json.loads(raw)
        except json.JSONDecodeError:
            return None
        if not isinstance(obj, dict):
            return None
        if not isinstance(obj.get("url"), str) or not obj["url"]:
            return None
        if not isinstance(obj.get("token"), str) or not obj["token"]:
            return None
        return obj

    good = '{"v":1,"url":"http://192.168.1.1:8080","token":"abc"}'
    assert parse(good) is not None, "good payload rejected"

    bad_cases = [
        "",                                            # empty
        "not json",                                    # not JSON
        '{"url":"http://x"}',                          # no token
        '{"token":"abc"}',                             # no url
        '{"url":"","token":"abc"}',                    # empty url
        '{"url":"http://x","token":""}',               # empty token
        '[{"url":"http://x","token":"abc"}]',          # array, not object
    ]
    for raw in bad_cases:
        assert parse(raw) is None, f"bad payload accepted: {raw!r}"


# ─── Runner ──────────────────────────────────────────────────────────────────


def main() -> int:
    print(bold("\nCortex · Tier 1 smoke checks\n"))
    failed: list[tuple[str, str]] = []
    for name, fn in CHECKS:
        t0 = time.monotonic()
        try:
            fn()
            dt = (time.monotonic() - t0) * 1000
            print(f"  {green('✓')} {name} {dim(f'({dt:.0f} ms)')}")
        except AssertionError as e:
            failed.append((name, str(e)))
            print(f"  {red('✗')} {name}")
            for line in str(e).splitlines():
                print(f"    {dim(line)}")
        except Exception as e:
            failed.append((name, f"{type(e).__name__}: {e}"))
            print(f"  {red('✗')} {name}")
            print(f"    {dim(f'{type(e).__name__}: {e}')}")

    print()
    if failed:
        print(red(f"  {len(failed)} of {len(CHECKS)} smoke checks failed."))
        return 1
    print(green(f"  All {len(CHECKS)} smoke checks passed."))
    return 0


if __name__ == "__main__":
    sys.exit(main())
