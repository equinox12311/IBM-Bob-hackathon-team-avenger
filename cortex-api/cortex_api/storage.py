"""SQLite + sqlite-vec storage layer.

Phase 1 (M2): replace the stub queries with real persistence and vector search.
The schema in ``init_db`` is the contract from docs/CONTRACTS.md — do not change
it without updating that document.
"""

from __future__ import annotations

import sqlite3
import time
from pathlib import Path
from typing import Iterable

import sqlite_vec

from cortex_api.config import settings
from cortex_api.models import Entry, EntrySource

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS entries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    text        TEXT NOT NULL,
    created_at  INTEGER NOT NULL,
    score       REAL NOT NULL DEFAULT 1.0,
    source      TEXT NOT NULL,
    repo        TEXT,
    file        TEXT,
    line_start  INTEGER,
    line_end    INTEGER,
    tags        TEXT
);

CREATE TABLE IF NOT EXISTS feedback (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id  INTEGER NOT NULL REFERENCES entries(id),
    signal    TEXT NOT NULL CHECK (signal IN ('boost','flag')),
    ts        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_entry ON feedback(entry_id);
"""

# vec_entries is created separately because it's a virtual table that depends
# on the embedding dimension (which depends on the configured embedding model).
VEC_TABLE_SQL = (
    "CREATE VIRTUAL TABLE IF NOT EXISTS vec_entries "
    "USING vec0(embedding FLOAT[{dim}])"
)


def _connect() -> sqlite3.Connection:
    db_path: Path = settings.diary_db_path
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.enable_load_extension(True)
    sqlite_vec.load(conn)
    conn.enable_load_extension(False)
    return conn


def init_db(embedding_dim: int = 384) -> None:
    """Create tables on first run."""

    with _connect() as conn:
        conn.executescript(SCHEMA_SQL)
        conn.execute(VEC_TABLE_SQL.format(dim=embedding_dim))
        conn.commit()


# ---------- write side -------------------------------------------------------


def insert_entry(
    *,
    text: str,
    source: EntrySource,
    embedding: list[float],
    repo: str | None = None,
    file: str | None = None,
    line_start: int | None = None,
    line_end: int | None = None,
    tags: Iterable[str] = (),
) -> tuple[int, int]:
    """Persist a new entry and its embedding. Returns (id, created_at)."""

    created_at = int(time.time() * 1000)
    tags_csv = ",".join(tags) if tags else None
    with _connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO entries
                (text, created_at, source, repo, file, line_start, line_end, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (text, created_at, source, repo, file, line_start, line_end, tags_csv),
        )
        entry_id = cur.lastrowid
        # TODO(M2 Phase 2): persist embedding via vec_entries virtual table
        conn.commit()
        return entry_id, created_at  # type: ignore[return-value]


# ---------- read side -------------------------------------------------------


def list_recent(limit: int = 20) -> list[Entry]:
    """Return the most-recent entries (timeline view). No embeddings required."""

    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM entries ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [_row_to_entry(r) for r in rows]


def search(query_embedding: list[float], k: int = 5) -> list[Entry]:
    """Vector search + re-ranking. Stub for Phase 2."""

    # TODO(M2 Phase 2): real KNN via sqlite-vec MATCH on vec_entries,
    # then re-rank with score * exp(-lambda * days_since_created) * cosine_sim
    return list_recent(limit=k)


# ---------- helpers ---------------------------------------------------------


def _row_to_entry(row: sqlite3.Row) -> Entry:
    tags_csv = row["tags"]
    return Entry(
        id=row["id"],
        text=row["text"],
        score=row["score"],
        source=row["source"],
        repo=row["repo"],
        file=row["file"],
        line_start=row["line_start"],
        line_end=row["line_end"],
        tags=[t for t in (tags_csv or "").split(",") if t],
        created_at=row["created_at"],
    )
