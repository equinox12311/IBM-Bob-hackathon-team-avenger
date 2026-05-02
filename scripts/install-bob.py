#!/usr/bin/env python3
"""Install Cortex into IBM Bob's local config — idempotent, safe to re-run.

Does three things:

1. Copies all five Cortex Bob extension layers into Bob's home dir:
     - custom_modes.yaml          ← bob/custom_modes.yaml.example
     - skills/cortex/             ← bob/skills/cortex/
     - commands/diary-*.md        ← bob/commands/
     - rules-cortex/              ← bob/rules-cortex/

2. Patches Bob's settings.json so a "cortex" MCP server is registered.
   Absolute paths are derived from this repo's location and the project venv.

3. Prints a copy-paste verification step.

Usage:
    python scripts/install-bob.py            # detect Bob home automatically
    python scripts/install-bob.py --dry-run
    python scripts/install-bob.py --bob-home ~/.bob
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_BOB_HOMES = [
    Path(os.environ["BOB_HOME"]) if os.environ.get("BOB_HOME") else None,
    Path.home() / ".bob",
    Path.home() / "Library" / "Application Support" / "bob",
]


# ---------- helpers --------------------------------------------------------


def detect_bob_home(custom: str | None) -> Path:
    if custom:
        return Path(custom).expanduser().resolve()
    for h in DEFAULT_BOB_HOMES:
        if h and h.exists() and h.is_dir():
            return h.resolve()
    return (Path.home() / ".bob").resolve()  # default; created if missing


def _replace(src: Path, dest: Path, dry_run: bool, label: str) -> None:
    """Copy src → dest; replaces existing dest. Creates parents."""
    if not src.exists():
        print(f"⚠  source missing: {src}")
        return
    if dry_run:
        print(f"[dry-run] would copy {src} → {dest}")
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        if dest.is_dir():
            shutil.rmtree(dest)
        else:
            dest.unlink()
    if src.is_dir():
        shutil.copytree(src, dest)
    else:
        shutil.copy2(src, dest)
    print(f"✓ {label}: {dest}")


# ---------- step 1: copy assets -------------------------------------------


def install_assets(bob_home: Path, dry_run: bool) -> None:
    src = REPO_ROOT / "bob"

    # custom_modes — preserve existing if non-empty (avoid clobbering user data)
    cm_src = src / "custom_modes.yaml.example"
    cm_dest = bob_home / "custom_modes.yaml"
    if cm_dest.exists() and cm_dest.stat().st_size > 0:
        sidecar = bob_home / "modes" / "cortex.yaml.example"
        _replace(cm_src, sidecar, dry_run, label="custom_modes (sidecar — merge manually)")
    else:
        _replace(cm_src, cm_dest, dry_run, label="custom_modes")

    _replace(src / "skills" / "cortex", bob_home / "skills" / "cortex", dry_run, label="skill: cortex")
    _replace(src / "rules-cortex", bob_home / "rules-cortex", dry_run, label="mode rules: rules-cortex")

    # commands: copy each .md (don't blow away user's other commands)
    cmd_src_dir = src / "commands"
    cmd_dest_dir = bob_home / "commands"
    if not dry_run:
        cmd_dest_dir.mkdir(parents=True, exist_ok=True)
    for f in sorted(cmd_src_dir.glob("*.md")):
        _replace(f, cmd_dest_dir / f.name, dry_run, label=f"slash command: {f.name}")


# ---------- step 2: patch MCP config --------------------------------------


def cortex_mcp_block(repo_root: Path) -> dict:
    venv_python = repo_root / ".venv" / "bin" / "python"
    return {
        "command": str(venv_python if venv_python.exists() else "python3"),
        "args": ["-m", "cortex_api.mcp_server"],
        "cwd": str(repo_root / "src" / "cortex-api"),
        "env": {
            "DIARY_TOKEN": os.environ.get("DIARY_TOKEN", "test"),
            "DIARY_DB_PATH": str(repo_root / "data" / "diary.db"),
            "EMBEDDINGS_PROVIDER": os.environ.get("EMBEDDINGS_PROVIDER", "local"),
            "LLM_PROVIDER": os.environ.get("LLM_PROVIDER", "off"),
        },
    }


def patch_mcp_config(bob_home: Path, dry_run: bool) -> None:
    settings_path = bob_home / "settings.json"
    if settings_path.exists():
        try:
            settings = json.loads(settings_path.read_text())
        except json.JSONDecodeError:
            print(f"⚠  {settings_path} is not valid JSON — leaving it; printing manual merge block")
            _print_manual_merge()
            return
    else:
        settings = {}

    settings.setdefault("mcpServers", {})
    settings["mcpServers"]["cortex"] = cortex_mcp_block(REPO_ROOT)

    if dry_run:
        print(f"[dry-run] would write {settings_path}:")
        print(json.dumps(settings, indent=2))
        return

    settings_path.parent.mkdir(parents=True, exist_ok=True)
    settings_path.write_text(json.dumps(settings, indent=2) + "\n")
    print(f"✓ MCP config patched: {settings_path} (mcpServers.cortex registered)")


def _print_manual_merge() -> None:
    block = {"mcpServers": {"cortex": cortex_mcp_block(REPO_ROOT)}}
    print()
    print("Paste this into Bob's settings.json under \"mcpServers\":")
    print(json.dumps(block, indent=2))
    print()


# ---------- main ----------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--bob-home", help="Bob config dir (default: auto-detect)")
    parser.add_argument("--dry-run", action="store_true", help="Print changes without applying")
    parser.add_argument(
        "--no-mcp",
        action="store_true",
        help="Skip patching settings.json (assets only)",
    )
    args = parser.parse_args()

    bob_home = detect_bob_home(args.bob_home)
    print(f"▶ Installing Cortex into Bob ({bob_home})")
    if not args.dry_run:
        bob_home.mkdir(parents=True, exist_ok=True)

    install_assets(bob_home, args.dry_run)

    if args.no_mcp:
        print("(skipped MCP config patch per --no-mcp)")
        _print_manual_merge()
    else:
        patch_mcp_config(bob_home, args.dry_run)

    print()
    print("✓ Done. Next:")
    print("  1. Restart Bob")
    print("  2. Switch to the '📓 Cortex' mode")
    print("  3. Try:  /diary-save just installed Cortex into Bob")
    print("          /diary-recall postgres pool")


if __name__ == "__main__":
    sys.exit(main())
