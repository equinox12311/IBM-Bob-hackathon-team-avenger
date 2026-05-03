"""Skills CRUD — read/write Bob skill manifests under ``bob/skills/<slug>/``.

Lets users create personal skills from inside the app without editing files.
The mobile ``app/skills.tsx`` screen drives this. Each skill lives at:

    bob/skills/<slug>/SKILL.md

with the standard YAML frontmatter (name, description) + Markdown body.

After creating a new skill, the user runs ``make install-bob`` to copy it
into ``~/.bob/skills/`` and have IBM Bob pick it up.
"""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Iterable

from cortex_api.config import settings

log = logging.getLogger(__name__)

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{1,63}$")
RESERVED = {"cortex"}  # ours; cannot be overwritten via this CRUD


def _root() -> Path:
    """Project root inferred from the configured DB path's grandparent."""
    return settings.diary_db_path.parent.parent


def _skills_dir() -> Path:
    return _root() / "bob" / "skills"


def _skill_path(slug: str) -> Path:
    return _skills_dir() / slug / "SKILL.md"


def _validate_slug(slug: str) -> None:
    if not SLUG_RE.match(slug):
        raise ValueError(
            "slug must be 2-64 chars, lowercase a-z/0-9/hyphen, starting with alnum"
        )
    if slug in RESERVED:
        raise ValueError(f"'{slug}' is reserved")


def _parse_frontmatter(text: str) -> tuple[dict, str]:
    """Return ({name, description, ...}, body) parsed from a SKILL.md."""

    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    fm_block, body = parts[1], parts[2].lstrip("\n")
    fm: dict[str, str] = {}
    for line in fm_block.strip().splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip()
    return fm, body


def _format_skill(name: str, description: str, body: str) -> str:
    return (
        "---\n"
        f"name: {name}\n"
        f"description: {description.strip()}\n"
        "---\n\n"
        f"{body.strip()}\n"
    )


# ---------- public CRUD ---------------------------------------------------


def list_skills() -> list[dict]:
    base = _skills_dir()
    if not base.exists():
        return []
    out: list[dict] = []
    for child in sorted(base.iterdir()):
        if not child.is_dir():
            continue
        slug = child.name
        manifest = child / "SKILL.md"
        if not manifest.exists():
            continue
        try:
            fm, _ = _parse_frontmatter(manifest.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError):
            continue
        out.append({
            "slug": slug,
            "name": fm.get("name", slug),
            "description": fm.get("description", ""),
            "managed": slug in RESERVED,
            "path": str(manifest.relative_to(_root())),
        })
    return out


def get_skill(slug: str) -> dict | None:
    _validate_slug(slug) if slug not in RESERVED else None
    path = _skill_path(slug)
    if not path.exists():
        return None
    fm, body = _parse_frontmatter(path.read_text(encoding="utf-8"))
    return {
        "slug": slug,
        "name": fm.get("name", slug),
        "description": fm.get("description", ""),
        "body": body,
        "managed": slug in RESERVED,
        "path": str(path.relative_to(_root())),
    }


def create_skill(slug: str, description: str, body: str, name: str | None = None) -> dict:
    _validate_slug(slug)
    if len(description.strip()) < 30:
        raise ValueError("description must be at least 30 chars (Bob's matcher needs detail)")
    if not body.strip():
        raise ValueError("body required")

    path = _skill_path(slug)
    if path.exists():
        raise FileExistsError(f"skill already exists: {slug}")

    path.parent.mkdir(parents=True, exist_ok=True)
    final_name = name or slug.replace("-", " ").title()
    path.write_text(_format_skill(final_name, description, body), encoding="utf-8")
    log.info("created skill: %s", path)
    return get_skill(slug)  # type: ignore[return-value]


def update_skill(
    slug: str,
    *,
    description: str | None = None,
    body: str | None = None,
    name: str | None = None,
) -> dict:
    _validate_slug(slug)
    if slug in RESERVED:
        raise PermissionError(f"'{slug}' is read-only (managed by the project)")
    existing = get_skill(slug)
    if existing is None:
        raise FileNotFoundError(slug)
    new_desc = description if description is not None else existing["description"]
    new_body = body if body is not None else existing["body"]
    new_name = name if name is not None else existing["name"]
    if len(new_desc.strip()) < 30:
        raise ValueError("description must be at least 30 chars")
    _skill_path(slug).write_text(
        _format_skill(new_name, new_desc, new_body), encoding="utf-8"
    )
    return get_skill(slug)  # type: ignore[return-value]


def delete_skill(slug: str) -> None:
    _validate_slug(slug)
    if slug in RESERVED:
        raise PermissionError(f"'{slug}' is read-only")
    path = _skill_path(slug)
    if not path.exists():
        raise FileNotFoundError(slug)
    # Remove the SKILL.md and clean up the directory if empty
    path.unlink()
    try:
        path.parent.rmdir()
    except OSError:
        pass


# ---------- security audit log -------------------------------------------


def audit_event(actor: str, action: str, target: str = "", note: str = "") -> int:
    """Append an audit log row. Used by the audit middleware."""

    from cortex_api import storage

    return storage.append_audit(actor=actor, action=action, target=target, note=note)


def list_audit(since_ms: int | None = None, limit: int = 200) -> list[dict]:
    from cortex_api import storage

    return storage.list_audit(since_ms=since_ms, limit=limit)
