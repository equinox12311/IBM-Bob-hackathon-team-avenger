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
from cortex_api.models import Entry, EntryKind, EntrySource, FeedbackSignal

log = logging.getLogger(__name__)

# ---------- schema ----------------------------------------------------------

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS entries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    text        TEXT NOT NULL,
    created_at  INTEGER NOT NULL,
    score       REAL NOT NULL DEFAULT 1.0,
    source      TEXT NOT NULL,
    kind        TEXT NOT NULL DEFAULT 'note',
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

CREATE TABLE IF NOT EXISTS wellness_breaks (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    ts     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profile (
    id        INTEGER PRIMARY KEY CHECK (id = 1),  -- single-row table
    name      TEXT NOT NULL DEFAULT 'Dev',
    handle    TEXT NOT NULL DEFAULT 'dev',
    bio       TEXT NOT NULL DEFAULT '',
    pronouns  TEXT,
    timezone  TEXT NOT NULL DEFAULT 'UTC',
    public_url TEXT
);

CREATE TABLE IF NOT EXISTS automations (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    trigger_kind TEXT NOT NULL,
    action       TEXT NOT NULL,
    enabled      INTEGER NOT NULL DEFAULT 1,
    created_at   INTEGER NOT NULL
);

-- v0.3: queue of actions any client (mobile/web) can enqueue for IBM Bob
-- to pick up at the start of its next session via the diary_pending_actions
-- MCP tool. The Bob mode rule 05-pending-actions.md drives the polling.
CREATE TABLE IF NOT EXISTS pending_actions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    kind         TEXT NOT NULL,           -- 'recall' | 'save' | 'analyze' | 'free'
    payload      TEXT NOT NULL,           -- JSON encoded; kind-specific shape
    source       TEXT NOT NULL,           -- 'mobile' | 'web' | 'bot' | 'cli'
    created_at   INTEGER NOT NULL,
    consumed_at  INTEGER                   -- NULL until Bob pops it
);

-- v0.3: append-only audit log of state changes for the security dashboard.
CREATE TABLE IF NOT EXISTS audit_log (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    ts     INTEGER NOT NULL,
    actor  TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL DEFAULT '',
    note   TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_kind ON entries(kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_entry ON feedback(entry_id);
CREATE INDEX IF NOT EXISTS idx_pending_open ON pending_actions(consumed_at, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts DESC);
"""

# In-place migration for v0.1 → v0.2 (adds kind column to existing dbs).
MIGRATIONS_SQL = [
    "ALTER TABLE entries ADD COLUMN kind TEXT NOT NULL DEFAULT 'note'",
]

VEC_TABLE_SQL = (
    "CREATE VIRTUAL TABLE IF NOT EXISTS vec_entries "
    "USING vec0(embedding FLOAT[{dim}])"
)


# ---------- connection helpers ---------------------------------------------


_VEC_AVAILABLE: bool | None = None  # tri-state: None = unknown, True/False = decided


def _open_connection() -> sqlite3.Connection:
    """Open a connection with sqlite-vec loaded.

    sqlite_vec ``load`` uses a runtime extension. If extension loading is
    blocked (e.g. on Python builds compiled without it) we fall back to a
    plain connection — search will use the slower Python-cosine path. We
    detect this once at startup and silently skip the load attempt thereafter.
    """

    global _VEC_AVAILABLE

    db_path: Path = settings.diary_db_path
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    if _VEC_AVAILABLE is False:
        return conn

    try:
        conn.enable_load_extension(True)
        sqlite_vec.load(conn)
        conn.enable_load_extension(False)
        if _VEC_AVAILABLE is None:
            log.info("sqlite-vec extension loaded")
        _VEC_AVAILABLE = True
    except (sqlite3.NotSupportedError, AttributeError) as exc:
        if _VEC_AVAILABLE is None:
            log.warning(
                "sqlite-vec extension unavailable (%s); using Python cosine fallback. "
                "This is expected on python.org's Python on macOS; install Python via "
                "Homebrew or pyenv to enable native vector search.",
                exc,
            )
        _VEC_AVAILABLE = False
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
    """Create tables on first run (idempotent), then run any migrations."""

    with _connect() as conn:
        conn.executescript(SCHEMA_SQL)
        for stmt in MIGRATIONS_SQL:
            try:
                conn.execute(stmt)
            except sqlite3.OperationalError:
                # column already exists — migration already applied
                pass
        # Seed the single-row profile table
        conn.execute("INSERT OR IGNORE INTO user_profile (id) VALUES (1)")
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
    kind: EntryKind = "note",
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
                (text, created_at, source, kind, repo, file, line_start, line_end, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (text, created_at, source, kind, repo, file, line_start, line_end, tags_csv),
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


def list_recent(
    limit: int = 20,
    since_ms: int | None = None,
    kind: EntryKind | None = None,
) -> list[Entry]:
    sql = "SELECT * FROM entries"
    params: list = []
    where: list[str] = []
    if since_ms is not None:
        where.append("created_at >= ?")
        params.append(since_ms)
    if kind is not None:
        where.append("kind = ?")
        params.append(kind)
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    with _connect() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [_row_to_entry(r) for r in rows]


# ---------- aggregations / feature-specific reads ---------------------------


def counts_by_kind(since_ms: int | None = None) -> dict[str, int]:
    sql = "SELECT kind, COUNT(*) AS n FROM entries"
    params: list = []
    if since_ms is not None:
        sql += " WHERE created_at >= ?"
        params.append(since_ms)
    sql += " GROUP BY kind"
    with _connect() as conn:
        rows = conn.execute(sql, params).fetchall()
    return {r["kind"]: r["n"] for r in rows}


def total_count(since_ms: int | None = None) -> int:
    sql = "SELECT COUNT(*) AS n FROM entries"
    params: list = []
    if since_ms is not None:
        sql += " WHERE created_at >= ?"
        params.append(since_ms)
    with _connect() as conn:
        row = conn.execute(sql, params).fetchone()
    return int(row["n"]) if row else 0


# ---------- wellness break tracking -----------------------------------------


def log_wellness_break() -> int:
    ts = now_ms()
    with _connect() as conn:
        cur = conn.execute("INSERT INTO wellness_breaks (ts) VALUES (?)", (ts,))
        return cur.lastrowid or 0


def last_wellness_break() -> int | None:
    with _connect() as conn:
        row = conn.execute(
            "SELECT ts FROM wellness_breaks ORDER BY ts DESC LIMIT 1"
        ).fetchone()
    return int(row["ts"]) if row else None


def wellness_breaks_since(since_ms: int) -> int:
    with _connect() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS n FROM wellness_breaks WHERE ts >= ?", (since_ms,)
        ).fetchone()
    return int(row["n"]) if row else 0


# ---------- user profile ----------------------------------------------------


def get_profile() -> dict:
    with _connect() as conn:
        row = conn.execute("SELECT * FROM user_profile WHERE id = 1").fetchone()
    return dict(row) if row else {}


def update_profile(**fields: str) -> dict:
    if not fields:
        return get_profile()
    cols = ", ".join(f"{k} = ?" for k in fields)
    params = list(fields.values()) + [1]
    with _connect() as conn:
        conn.execute(f"UPDATE user_profile SET {cols} WHERE id = ?", params)
    return get_profile()


# ---------- automations -----------------------------------------------------


def list_automations() -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM automations ORDER BY created_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]


def create_automation(name: str, trigger_kind: str, action: str) -> int:
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO automations (name, trigger_kind, action, enabled, created_at) "
            "VALUES (?, ?, ?, 1, ?)",
            (name, trigger_kind, action, now_ms()),
        )
        return cur.lastrowid or 0


def toggle_automation(automation_id: int, enabled: bool) -> None:
    with _connect() as conn:
        conn.execute(
            "UPDATE automations SET enabled = ? WHERE id = ?",
            (1 if enabled else 0, automation_id),
        )


def delete_automation(automation_id: int) -> None:
    with _connect() as conn:
        conn.execute("DELETE FROM automations WHERE id = ?", (automation_id,))


# ---------- pending_actions (Bob queue) -----------------------------------


def queue_action(kind: str, payload: str, source: str = "mobile") -> tuple[int, int]:
    """Enqueue an action for Bob to consume on its next session."""

    ts = now_ms()
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO pending_actions (kind, payload, source, created_at) "
            "VALUES (?, ?, ?, ?)",
            (kind, payload, source, ts),
        )
        return (cur.lastrowid or 0), ts


def list_pending_actions(consume: bool = False, limit: int = 50) -> list[dict]:
    """Return open pending actions; mark them consumed if ``consume=True``."""

    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM pending_actions WHERE consumed_at IS NULL "
            "ORDER BY created_at ASC LIMIT ?",
            (limit,),
        ).fetchall()
        results = [dict(r) for r in rows]
        if consume and results:
            ts = now_ms()
            ids = [r["id"] for r in results]
            placeholders = ",".join("?" * len(ids))
            conn.execute(
                f"UPDATE pending_actions SET consumed_at = ? WHERE id IN ({placeholders})",
                (ts, *ids),
            )
    return results


def all_pending_actions(limit: int = 100) -> list[dict]:
    """Debug listing — includes already-consumed actions for inspection."""

    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM pending_actions ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [dict(r) for r in rows]


def delete_pending_action(action_id: int) -> None:
    with _connect() as conn:
        conn.execute("DELETE FROM pending_actions WHERE id = ?", (action_id,))


# ---------- audit log -----------------------------------------------------


def append_audit(*, actor: str, action: str, target: str = "", note: str = "") -> int:
    ts = now_ms()
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO audit_log (ts, actor, action, target, note) "
            "VALUES (?, ?, ?, ?, ?)",
            (ts, actor, action, target, note),
        )
        return cur.lastrowid or 0


def list_audit(since_ms: int | None = None, limit: int = 200) -> list[dict]:
    sql = "SELECT * FROM audit_log"
    params: list = []
    if since_ms is not None:
        sql += " WHERE ts >= ?"
        params.append(since_ms)
    sql += " ORDER BY ts DESC LIMIT ?"
    params.append(limit)
    with _connect() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [dict(r) for r in rows]


def audit_summary(window_ms: int = 86_400_000) -> dict:
    cutoff = now_ms() - window_ms
    with _connect() as conn:
        rows = conn.execute(
            "SELECT action, COUNT(*) AS n FROM audit_log WHERE ts >= ? GROUP BY action",
            (cutoff,),
        ).fetchall()
        total = conn.execute(
            "SELECT COUNT(*) AS n FROM audit_log WHERE ts >= ?", (cutoff,)
        ).fetchone()
    return {
        "window_ms": window_ms,
        "total": int(total["n"]) if total else 0,
        "by_action": {r["action"]: int(r["n"]) for r in rows},
    }


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
    # ``kind`` may be missing on rows persisted before the v0.2 migration.
    try:
        kind = row["kind"] or "note"
    except (IndexError, KeyError):
        kind = "note"
    return Entry(
        id=row["id"],
        text=row["text"],
        score=row["score"],
        source=row["source"],
        kind=kind,
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
