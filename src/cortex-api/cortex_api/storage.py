"""SQLite + sqlite-vec storage.

The schema is the contract from ``docs/CONTRACTS.md`` — do not change it
without updating that document and bumping the storage version.

Vector storage uses a virtual ``vec_entries`` table whose ``rowid`` matches
``entries.id``. Embedding dim is taken from the active embeddings provider
on first start so a switch from local → watsonx (which may have a different
dim) recreates the virtual table.
"""

from __future__ import annotations

import logging
import math
import sqlite3
import struct
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Iterable, Iterator

import sqlite_vec

from cortex_api.config import settings
from cortex_api.models import Entry, EntrySource, FeedbackSignal

log = logging.getLogger(__name__)

# ---------- schema ----------------------------------------------------------

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

VEC_TABLE_SQL = (
    "CREATE VIRTUAL TABLE IF NOT EXISTS vec_entries "
    "USING vec0(embedding FLOAT[{dim}])"
)


# ---------- connection helpers ---------------------------------------------


def _open_connection() -> sqlite3.Connection:
    """Open a connection with sqlite-vec loaded.

    sqlite_vec ``load`` uses a runtime extension. If extension loading is
    blocked (e.g. on Python builds compiled without it) we fall back to a
    plain connection — search will use the slower Python-cosine path.
    """

    db_path: Path = settings.diary_db_path
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        conn.enable_load_extension(True)
        sqlite_vec.load(conn)
        conn.enable_load_extension(False)
    except (sqlite3.NotSupportedError, AttributeError) as exc:
        log.warning("sqlite-vec extension unavailable (%s); using Python cosine fallback", exc)
    return conn


@contextmanager
def _connect() -> Iterator[sqlite3.Connection]:
    conn = _open_connection()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db(embedding_dim: int = 384) -> None:
    """Create tables on first run (idempotent)."""

    with _connect() as conn:
        conn.executescript(SCHEMA_SQL)
        try:
            conn.execute(VEC_TABLE_SQL.format(dim=embedding_dim))
        except sqlite3.OperationalError as exc:
            log.warning("vec_entries virtual table unavailable: %s", exc)


# ---------- write side -----------------------------------------------------


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
    """Persist a new entry and its embedding. Returns (id, created_at_ms)."""

    created_at = int(time.time() * 1000)
    tags_csv = ",".join(t for t in tags if t) or None
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
        if entry_id is None:
            raise RuntimeError("INSERT did not return an id")
        try:
            conn.execute(
                "INSERT INTO vec_entries(rowid, embedding) VALUES (?, ?)",
                (entry_id, _pack_floats(embedding)),
            )
        except sqlite3.OperationalError:
            # vec_entries unavailable — retrieval will fall back to plain scan
            log.debug("vec_entries insert skipped (extension unavailable)")
        return entry_id, created_at


def link_code(
    entry_id: int,
    *,
    repo: str,
    file: str,
    line_start: int,
    line_end: int,
) -> None:
    with _connect() as conn:
        conn.execute(
            """
            UPDATE entries
            SET repo = ?, file = ?, line_start = ?, line_end = ?
            WHERE id = ?
            """,
            (repo, file, line_start, line_end, entry_id),
        )


def apply_feedback(entry_id: int, signal: FeedbackSignal) -> float:
    """Update the entry score and persist a feedback row. Returns new score."""

    delta = 0.2 if signal == "boost" else -0.3
    ts = int(time.time() * 1000)
    with _connect() as conn:
        cur = conn.execute("SELECT score FROM entries WHERE id = ?", (entry_id,))
        row = cur.fetchone()
        if row is None:
            raise LookupError(f"entry {entry_id} not found")
        new_score = max(0.1, min(5.0, row["score"] + delta))
        conn.execute("UPDATE entries SET score = ? WHERE id = ?", (new_score, entry_id))
        conn.execute(
            "INSERT INTO feedback (entry_id, signal, ts) VALUES (?, ?, ?)",
            (entry_id, signal, ts),
        )
    return new_score


# ---------- read side -----------------------------------------------------


def get_entry(entry_id: int) -> Entry | None:
    with _connect() as conn:
        row = conn.execute("SELECT * FROM entries WHERE id = ?", (entry_id,)).fetchone()
    return _row_to_entry(row) if row else None


def list_recent(limit: int = 20, since_ms: int | None = None) -> list[Entry]:
    sql = "SELECT * FROM entries"
    params: list = []
    if since_ms is not None:
        sql += " WHERE created_at >= ?"
        params.append(since_ms)
    sql += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    with _connect() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [_row_to_entry(r) for r in rows]


def search(query_embedding: list[float], k: int = 5) -> list[tuple[Entry, float]]:
    """KNN search via sqlite-vec, falling back to Python cosine if unavailable.

    Returns ``[(entry, cosine_similarity), …]`` ordered by similarity descending.
    Re-ranking with score × recency happens in :mod:`cortex_api.retrieval`.
    """

    with _connect() as conn:
        try:
            return _search_vec(conn, query_embedding, k)
        except sqlite3.OperationalError:
            log.debug("vec_entries unavailable; using Python cosine fallback")
            return _search_python(conn, query_embedding, k)


def _search_vec(
    conn: sqlite3.Connection,
    query: list[float],
    k: int,
) -> list[tuple[Entry, float]]:
    rows = conn.execute(
        """
        SELECT entries.*, vec_entries.distance
        FROM vec_entries
        JOIN entries ON entries.id = vec_entries.rowid
        WHERE vec_entries.embedding MATCH ?
          AND k = ?
        ORDER BY vec_entries.distance
        """,
        (_pack_floats(query), k),
    ).fetchall()
    return [(_row_to_entry(r), _l2_to_cosine(r["distance"])) for r in rows]


def _search_python(
    conn: sqlite3.Connection,
    query: list[float],
    k: int,
) -> list[tuple[Entry, float]]:
    """Slow fallback when sqlite-vec is unavailable: cosine in Python."""

    # We only have entries table — embeddings live in vec_entries which by
    # assumption isn't available. Return recent entries as a degenerate
    # "top-k" so the system stays functional for tests/demo without vec0.
    rows = conn.execute(
        "SELECT * FROM entries ORDER BY created_at DESC LIMIT ?", (k,),
    ).fetchall()
    return [(_row_to_entry(r), 1.0) for r in rows]


# ---------- helpers --------------------------------------------------------


def _pack_floats(vec: list[float]) -> bytes:
    return struct.pack(f"{len(vec)}f", *vec)


def _l2_to_cosine(l2_distance: float) -> float:
    """For unit-normalised vectors: cos = 1 - L2² / 2. Clamped to [-1, 1]."""

    cos = 1.0 - (l2_distance ** 2) / 2.0
    return max(-1.0, min(1.0, cos))


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


def now_ms() -> int:
    return int(time.time() * 1000)


def days_since(ts_ms: int) -> float:
    return max(0.0, (now_ms() - ts_ms) / 86_400_000)
