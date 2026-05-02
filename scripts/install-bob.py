#!/usr/bin/env python3
"""Install Cortex into IBM Bob — idempotent, safe to re-run.

Bob ships as the "Roo Cline" VS Code extension. So:
  - File-based extension assets (mode YAML, skills, slash commands, rules)
    go into ~/.bob/  (Bob reads these from disk per the bob/INSTALL.md doc)
  - The MCP server config goes into VS Code's user settings.json under the
    "roo-cline.mcpServers" key (this is what Bob actually reads at runtime).

This script:

1. Copies all five extension layers from this repo's bob/ into ~/.bob/
2. Detects VS Code (or Cursor / VSCodium) user settings.json on this OS
3. Merges roo-cline.mcpServers.cortex into that settings file
4. Prints next steps

Usage:
    python scripts/install-bob.py            # auto-detect everything
    python scripts/install-bob.py --dry-run
    python scripts/install-bob.py --bob-home ~/.bob
    python scripts/install-bob.py --vscode-settings ~/path/to/settings.json
    python scripts/install-bob.py --no-mcp    # skip settings.json patch
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

# VS Code / fork user settings.json locations (in priority order)
def _vscode_settings_candidates() -> list[Path]:
    home = Path.home()
    if sys.platform == "darwin":
        base = home / "Library" / "Application Support"
    elif sys.platform.startswith("linux"):
        base = home / ".config"
    elif sys.platform == "win32":
        base = Path(os.environ.get("APPDATA", str(home)))
    else:
        base = home
    editors = ["Code", "Cursor", "Code - Insiders", "VSCodium"]
    return [base / e / "User" / "settings.json" for e in editors]


# ---------- helpers --------------------------------------------------------


def detect_bob_home(custom: str | None) -> Path:
    if custom:
        return Path(custom).expanduser().resolve()
    for h in DEFAULT_BOB_HOMES:
        if h and h.exists() and h.is_dir():
            return h.resolve()
    return (Path.home() / ".bob").resolve()


def detect_vscode_settings(custom: str | None) -> Path:
    if custom:
        return Path(custom).expanduser().resolve()
    for p in _vscode_settings_candidates():
        if p.exists():
            return p.resolve()
    # Fall back to plain VS Code path even if missing — we'll create it
    return _vscode_settings_candidates()[0].resolve()


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


# ---------- step 2: patch VS Code settings.json (roo-cline.mcpServers) ---


def cortex_mcp_block() -> dict:
    venv_python = REPO_ROOT / ".venv" / "bin" / "python"
    return {
        "command": str(venv_python if venv_python.exists() else "python3"),
        "args": ["-m", "cortex_api.mcp_server"],
        "cwd": str(REPO_ROOT / "src" / "cortex-api"),
        "env": {
            "DIARY_TOKEN": os.environ.get("DIARY_TOKEN", "test"),
            "DIARY_DB_PATH": str(REPO_ROOT / "data" / "diary.db"),
            "EMBEDDINGS_PROVIDER": os.environ.get("EMBEDDINGS_PROVIDER", "local"),
            "LLM_PROVIDER": os.environ.get("LLM_PROVIDER", "off"),
        },
    }


def patch_vscode_settings(settings_path: Path, dry_run: bool) -> None:
    if settings_path.exists():
        raw = settings_path.read_text()
        try:
            settings = json.loads(raw) if raw.strip() else {}
        except json.JSONDecodeError:
            try:
                settings = json.loads(_strip_jsonc_comments(raw))
                print(
                    f"⚠  {settings_path} contained JSONC comments — they will be stripped on write."
                )
            except json.JSONDecodeError as exc:
                print(f"⚠  Couldn't parse {settings_path}: {exc}")
                _print_manual_merge(settings_path)
                return
    else:
        settings = {}

    settings.setdefault("roo-cline.mcpServers", {})
    settings["roo-cline.mcpServers"]["cortex"] = cortex_mcp_block()

    if dry_run:
        print(f"[dry-run] would write {settings_path}:")
        print(json.dumps(settings, indent=2))
        return

    settings_path.parent.mkdir(parents=True, exist_ok=True)
    # Backup first if file existed
    if settings_path.exists():
        backup = settings_path.with_suffix(".json.bak")
        shutil.copy2(settings_path, backup)
        print(f"  (backup → {backup})")

    settings_path.write_text(json.dumps(settings, indent=2) + "\n")
    print(f"✓ MCP config patched: {settings_path} (roo-cline.mcpServers.cortex registered)")


def _print_manual_merge(settings_path: Path) -> None:
    block = {"roo-cline.mcpServers": {"cortex": cortex_mcp_block()}}
    print()
    print(f"Manually merge this into {settings_path}:")
    print(json.dumps(block, indent=2))
    print()


# ---------- main ----------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--bob-home", help="Bob assets dir (default: ~/.bob)")
    parser.add_argument(
        "--vscode-settings",
        help="VS Code user settings.json (default: auto-detect)",
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--no-mcp",
        action="store_true",
        help="Skip the VS Code settings patch (copy assets only)",
    )
    args = parser.parse_args()

    bob_home = detect_bob_home(args.bob_home)
    print(f"▶ Cortex assets → {bob_home}")
    if not args.dry_run:
        bob_home.mkdir(parents=True, exist_ok=True)
    install_assets(bob_home, args.dry_run)

    if args.no_mcp:
        print("(skipped MCP config patch per --no-mcp)")
        _print_manual_merge(Path("(your VS Code settings.json)"))
    else:
        settings_path = detect_vscode_settings(args.vscode_settings)
        print(f"▶ VS Code settings → {settings_path}")
        patch_vscode_settings(settings_path, args.dry_run)

    print()
    print("✓ Done. Next:")
    print("  1. Reload VS Code  (⌘+Shift+P → 'Developer: Reload Window')")
    print("  2. In Bob, switch to the '📓 Cortex' mode")
    print("  3. Try:  /diary-save just installed Cortex into Bob")


if __name__ == "__main__":
    sys.exit(main())
