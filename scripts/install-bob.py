#!/usr/bin/env python3
"""Install Cortex into IBM Bob — idempotent, safe to re-run.

IBM Bob is its own editor. It reads:
  - Extension assets (mode YAML, skills, slash commands, rules) from ~/.bob/
  - MCP server config from ~/.bob/settings/mcp_settings.json
    (top-level mcpServers map — same shape as Claude Desktop)

For workspace-scoped overrides, it also reads <project>/.bob/mcp.json.

This script writes to BOTH so the install works whether Bob looks at
global or workspace config first.

Usage:
    python scripts/install-bob.py
    python scripts/install-bob.py --dry-run
    python scripts/install-bob.py --bob-home ~/.bob
    python scripts/install-bob.py --no-mcp          # assets only
"""

from __future__ import annotations

import argparse
import json
import os
import re
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
    return (Path.home() / ".bob").resolve()


def _replace(src: Path, dest: Path, dry_run: bool, label: str) -> None:
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


def _strip_jsonc_comments(text: str) -> str:
    """Best-effort JSONC → JSON. Strips // line and /* */ block comments."""
    # Remove block comments first (DOTALL so they can span lines)
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    # Remove line comments — naive but correct for typical settings.json
    text = re.sub(r"^[^\"\n]*?//[^\n]*$", lambda m: re.sub(r"//.*$", "", m.group(0)), text, flags=re.MULTILINE)
    return text


# ---------- step 1: copy file-based assets --------------------------------


def install_assets(bob_home: Path, dry_run: bool) -> None:
    src = REPO_ROOT / "bob"

    cm_src = src / "custom_modes.yaml.example"
    cm_dest = bob_home / "custom_modes.yaml"
    if cm_dest.exists() and cm_dest.stat().st_size > 0:
        sidecar = bob_home / "modes" / "cortex.yaml.example"
        _replace(cm_src, sidecar, dry_run, label="custom_modes (sidecar — merge manually)")
    else:
        _replace(cm_src, cm_dest, dry_run, label="custom_modes")

    _replace(src / "skills" / "cortex", bob_home / "skills" / "cortex", dry_run, label="skill: cortex")
    _replace(src / "rules-cortex", bob_home / "rules-cortex", dry_run, label="mode rules: rules-cortex")

    cmd_src_dir = src / "commands"
    cmd_dest_dir = bob_home / "commands"
    if not dry_run:
        cmd_dest_dir.mkdir(parents=True, exist_ok=True)
    for f in sorted(cmd_src_dir.glob("*.md")):
        _replace(f, cmd_dest_dir / f.name, dry_run, label=f"slash command: {f.name}")


# ---------- step 2: patch ~/.bob/mcp.json --------------------------------


def cortex_mcp_block() -> dict:
    # Windows venv uses Scripts\python.exe; Unix uses bin/python
    venv_python_win = REPO_ROOT / ".venv" / "Scripts" / "python.exe"
    venv_python_unix = REPO_ROOT / ".venv" / "bin" / "python"
    if venv_python_win.exists():
        python_cmd = str(venv_python_win)
    elif venv_python_unix.exists():
        python_cmd = str(venv_python_unix)
    else:
        python_cmd = "python"   # fallback — must be on PATH

    return {
        "command": python_cmd,
        "args": ["-m", "cortex_api.mcp_server"],
        "cwd": str(REPO_ROOT / "src" / "cortex-api"),
        "env": {
            "PYTHONPATH": str(REPO_ROOT / "src" / "cortex-api"),
            "DIARY_TOKEN": os.environ.get("DIARY_TOKEN", "test"),
            "DIARY_DB_PATH": str(REPO_ROOT / "data" / "diary.db"),
            "EMBEDDINGS_PROVIDER": os.environ.get("EMBEDDINGS_PROVIDER", "local"),
            "LLM_PROVIDER": os.environ.get("LLM_PROVIDER", "off"),
        },
    }


def _patch_one(mcp_path: Path, dry_run: bool) -> None:
    """Merge cortex into the mcpServers map at mcp_path. Idempotent."""

    if mcp_path.exists():
        raw = mcp_path.read_text()
        try:
            existing = json.loads(raw) if raw.strip() else {}
        except json.JSONDecodeError:
            try:
                existing = json.loads(_strip_jsonc_comments(raw))
                print(f"⚠  {mcp_path} had JSONC comments — they will be stripped on write.")
            except json.JSONDecodeError as exc:
                print(f"⚠  Couldn't parse {mcp_path}: {exc}")
                _print_manual_merge(mcp_path)
                return
    else:
        existing = {}

    existing.setdefault("mcpServers", {})
    existing["mcpServers"]["cortex"] = cortex_mcp_block()

    if dry_run:
        print(f"[dry-run] would write {mcp_path}:")
        print(json.dumps(existing, indent=2))
        return

    mcp_path.parent.mkdir(parents=True, exist_ok=True)
    if mcp_path.exists():
        backup = mcp_path.with_suffix(".json.bak")
        shutil.copy2(mcp_path, backup)
        print(f"  (backup → {backup})")

    mcp_path.write_text(json.dumps(existing, indent=2) + "\n")
    print(f"✓ MCP config patched: {mcp_path}")


def patch_mcp_config(bob_home: Path, dry_run: bool) -> None:
    """Write to BOTH global and workspace MCP configs so we cover Bob's reads."""

    # Bob's canonical global config (confirmed empirically)
    global_path = bob_home / "settings" / "mcp_settings.json"
    _patch_one(global_path, dry_run)

    # Workspace-scoped override (the project's own .bob/mcp.json)
    workspace_path = REPO_ROOT / ".bob" / "mcp.json"
    _patch_one(workspace_path, dry_run)


def _print_manual_merge(mcp_path: Path) -> None:
    block = {"mcpServers": {"cortex": cortex_mcp_block()}}
    print()
    print(f"Manually merge this into {mcp_path}:")
    print(json.dumps(block, indent=2))
    print()


# ---------- main ----------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--bob-home", help="Bob assets dir (default: ~/.bob)")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--no-mcp",
        action="store_true",
        help="Skip the mcp.json patch (copy assets only)",
    )
    args = parser.parse_args()

    bob_home = detect_bob_home(args.bob_home)
    print(f"▶ Cortex assets → {bob_home}")
    if not args.dry_run:
        bob_home.mkdir(parents=True, exist_ok=True)
    install_assets(bob_home, args.dry_run)

    if args.no_mcp:
        print("(skipped MCP config patch per --no-mcp)")
        _print_manual_merge(bob_home / "settings" / "mcp_settings.json")
    else:
        patch_mcp_config(bob_home, args.dry_run)

    print()
    print("✓ Done. Next:")
    print("  1. Reload Bob  (⌘+Shift+P → 'Developer: Reload Window' in Bob)")
    print("  2. Switch to the '📓 Cortex' mode")
    print("  3. Try:  /diary-save just installed Cortex into Bob")


if __name__ == "__main__":
    sys.exit(main())
