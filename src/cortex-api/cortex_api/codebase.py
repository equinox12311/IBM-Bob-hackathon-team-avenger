"""Codebase indexer — walk a project, chunk source files, embed into the
existing ``vec_entries`` store with ``kind="code"``.

Once indexed, ``GET /api/v1/search`` (and Bob's ``diary_recall``) can ground
answers in the user's own code, not just diary entries. Local Granite uses
this in ``/analyze/code`` and ``/suggest/next``.

Cheap and synchronous on purpose — for the hackathon demo we index small
repos (a few hundred source files). Larger repos would benefit from a
background worker; deferred to v0.4.
"""

from __future__ import annotations

import logging
from collections import Counter
from pathlib import Path
from typing import Iterable

from cortex_api import storage
from cortex_api.embeddings import get_provider

log = logging.getLogger(__name__)

# Default include set — extend via the index() ``extensions`` parameter.
DEFAULT_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx",
    ".java", ".go", ".rs", ".rb", ".php",
    ".c", ".cpp", ".h", ".hpp",
    ".sh", ".bash", ".zsh",
    ".yml", ".yaml", ".toml",
    ".sql",
    ".md",  # docs are valuable too
}

DEFAULT_IGNORE_DIRS = {
    ".git", ".bob",
    ".venv", "venv", "env",
    "node_modules", ".next", ".turbo",
    "dist", "build", "out",
    "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache",
    ".vscode", ".idea",
    "coverage", "target",
    "models",  # Granite GGUF lives here; do not re-embed
    "data",    # SQLite db
}

DEFAULT_IGNORE_FILES = {
    ".DS_Store", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "poetry.lock", "Cargo.lock",
}

MAX_FILE_BYTES = 200 * 1024  # skip files larger than 200KB
CHUNK_LINES = 200            # ~200-line chunks make for tight RAG context


# ---------- public API -----------------------------------------------------


def index_path(
    repo_path: Path | str,
    *,
    extensions: Iterable[str] | None = None,
    max_files: int = 200,
    skip_existing: bool = True,
) -> dict:
    """Walk ``repo_path`` and embed source files as ``kind="code"`` entries.

    Returns a summary: ``{indexed, skipped_large, skipped_existing, errors,
    by_extension, files}``.
    """

    root = Path(repo_path).expanduser().resolve()
    if not root.exists():
        raise FileNotFoundError(f"path not found: {root}")
    exts = {e.lower() for e in (extensions or DEFAULT_EXTENSIONS)}

    provider = get_provider()
    storage.init_db(embedding_dim=provider.dim)

    indexed = 0
    skipped_large = 0
    skipped_existing = 0
    errors = 0
    by_ext: Counter[str] = Counter()
    files: list[str] = []

    existing = _existing_paths(root) if skip_existing else set()

    for path in _walk(root, exts, DEFAULT_IGNORE_DIRS, DEFAULT_IGNORE_FILES):
        if indexed >= max_files:
            break
        rel = str(path.relative_to(root))

        try:
            stat = path.stat()
            if stat.st_size > MAX_FILE_BYTES:
                skipped_large += 1
                continue

            if skip_existing and rel in existing:
                skipped_existing += 1
                continue

            text = path.read_text(encoding="utf-8", errors="replace")
        except (OSError, UnicodeDecodeError):
            errors += 1
            continue

        chunks = list(_chunk_by_lines(text, CHUNK_LINES))
        ext = path.suffix.lower()

        for line_start, line_end, body in chunks:
            try:
                embedding = provider.embed(body)
                storage.insert_entry(
                    text=body,
                    source="web",  # closest existing source for "indexed by API"
                    embedding=embedding,
                    kind="code",
                    repo=str(root),
                    file=rel,
                    line_start=line_start,
                    line_end=line_end,
                    tags=[ext.lstrip("."), "code"],
                )
            except Exception:  # noqa: BLE001 — keep indexer running through bad chunks
                errors += 1
                continue

        by_ext[ext] += 1
        files.append(rel)
        indexed += 1

    return {
        "root": str(root),
        "indexed": indexed,
        "skipped_large": skipped_large,
        "skipped_existing": skipped_existing,
        "errors": errors,
        "by_extension": dict(by_ext),
        "files": files,
    }


def list_indexed_files(repo_path: Path | str | None = None) -> list[dict]:
    """Distinct (file, repo) pairs across all ``kind="code"`` entries.

    Returns ``[{path, repo, lines, chunks}, …]``. Cheap aggregation on top
    of the existing storage layer; no new tables.
    """

    entries = storage.list_recent(limit=10_000, kind="code")
    if repo_path:
        target = str(Path(repo_path).expanduser().resolve())
        entries = [e for e in entries if e.repo == target]

    seen: dict[str, dict] = {}
    for e in entries:
        key = f"{e.repo or ''}::{e.file or ''}"
        s = seen.setdefault(
            key,
            {"path": e.file, "repo": e.repo, "chunks": 0, "lines": 0},
        )
        s["chunks"] += 1
        if e.line_end:
            s["lines"] = max(s["lines"], e.line_end)
    return list(seen.values())


def get_indexed_file(repo_path: Path | str, file_path: str) -> dict | None:
    """Reassemble a file's content from its chunks. Returns ``None`` if absent."""

    target_repo = str(Path(repo_path).expanduser().resolve())
    entries = storage.list_recent(limit=10_000, kind="code")
    relevant = [
        e for e in entries
        if e.repo == target_repo and e.file == file_path
    ]
    if not relevant:
        return None
    relevant.sort(key=lambda e: e.line_start or 0)
    body = "\n".join(e.text for e in relevant)
    return {
        "path": file_path,
        "repo": target_repo,
        "lines": relevant[-1].line_end or 0,
        "chunks": len(relevant),
        "body": body,
    }


# ---------- helpers --------------------------------------------------------


def _walk(
    root: Path,
    extensions: set[str],
    ignore_dirs: set[str],
    ignore_files: set[str],
) -> Iterable[Path]:
    """Yield candidate files under ``root`` respecting ignore lists."""

    stack = [root]
    while stack:
        current = stack.pop()
        try:
            for child in current.iterdir():
                if child.is_dir():
                    if child.name in ignore_dirs or child.name.startswith("."):
                        # Allow .github/.bob etc. only via explicit list; default skip dotdirs
                        if child.name not in {".github"}:
                            continue
                    stack.append(child)
                elif child.is_file():
                    if child.name in ignore_files:
                        continue
                    if child.suffix.lower() in extensions:
                        yield child
        except (PermissionError, OSError):
            continue


def _chunk_by_lines(text: str, chunk_lines: int) -> Iterable[tuple[int, int, str]]:
    """Yield ``(line_start, line_end, body)`` for each chunk_lines-sized chunk."""

    lines = text.splitlines()
    if not lines:
        return
    for start in range(0, len(lines), chunk_lines):
        end = min(start + chunk_lines, len(lines))
        body = "\n".join(lines[start:end])
        # 1-indexed line numbers for human-readable citations
        yield start + 1, end, body


def _existing_paths(root: Path) -> set[str]:
    """Set of relative file paths already indexed under ``root``."""

    target = str(root)
    entries = storage.list_recent(limit=10_000, kind="code")
    return {
        e.file for e in entries if e.repo == target and e.file
    }
