#!/usr/bin/env python3
"""Seed the diary with realistic demo entries drawn from this codebase.

Generates ~30 entries (decisions, fixes, bugs, insights, snippets, ideas,
notes, tasks) that reference real file paths in the repo and cover the
features we shipped. Timestamps are spread across the last 7 days so the
Today / Timeline / Calendar screens look lived-in.

Idempotent: every entry carries the tag ``seed:demo`` so re-running this
script clears the previous batch first.

Usage:
    .venv/bin/python scripts/seed.py
    .venv/bin/python scripts/seed.py --keep-existing  # don't clear
"""

from __future__ import annotations

import argparse
import random
import sqlite3
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "src" / "cortex-api"))

from cortex_api import storage  # noqa: E402
from cortex_api.config import settings  # noqa: E402
from cortex_api.embeddings import get_provider  # noqa: E402

SEED_TAG = "seed:demo"


def ms(days_ago: float, hour: int = 10, minute: int = 0) -> int:
    """Convert (days_ago, hour, minute) into a unix-ms timestamp."""
    base = datetime.now(tz=timezone.utc) - timedelta(days=days_ago)
    base = base.replace(hour=hour, minute=minute, second=0, microsecond=0)
    return int(base.timestamp() * 1000)


# (days_ago, hour, kind, source, text, file, tags, repo)
ENTRIES: list[tuple] = [
    # ── 7 days ago — start of the project ─────────────────────────────────
    (7.0, 9, "decision", "web",
     "Pivoting from a generic note app to a developer's second brain — "
     "Cortex lives inside IBM Bob via MCP + custom mode + skill + slash "
     "commands. All five extension surfaces, not just one.",
     None, ["bob", "mcp", "architecture"]),
    (7.0, 11, "idea", "mobile",
     "Three tiers of memory: Diary (sqlite-vec, on-device) → Granite "
     "(local + watsonx) → IBM Bob (escalation queue). Each tier owns a "
     "specific responsibility and never overlaps.",
     None, ["architecture", "memory"]),
    (6.5, 14, "decision", "web",
     "Locking the design tokens: Plus Jakarta Sans + Space Grotesk, "
     "primary #004cca, secondary #731be5, tertiary #8e4000, card radius "
     "32, chip radius 100. Every screen composes from this.",
     "theme.md", ["design-system", "tokens"]),

    # ── 6 days ago — backend foundations ──────────────────────────────────
    (6.0, 10, "code", "bob",
     "sqlite-vec virtual table for vector search. Falls back to Python "
     "cosine if the extension fails to load (which it does on python.org "
     "Python 3.13 — they don't compile with extension loading enabled).",
     "src/cortex-api/cortex_api/storage.py", ["sqlite-vec", "fallback"]),
    (5.8, 16, "fix", "bob",
     "Fixed a subtle bug in retrieval.py where recency rerank was using "
     "ms instead of seconds for the decay constant. Two-week-old entries "
     "were ranking above today's. Now τ = 86400 * 14 in seconds.",
     "src/cortex-api/cortex_api/retrieval.py", ["bug-fix", "rerank"]),

    # ── 5 days ago — IBM Bob extensions ────────────────────────────────────
    (5.0, 9, "decision", "bob",
     "Going wide on Bob: shipping all 5 extension surfaces (MCP, mode, "
     "skill, slash commands, mode rules). Coin budget per member is 40 "
     "× 4 = 160 total — enough room to use Bob heavily during the build.",
     "bob/INSTALL.md", ["bob", "judging-criteria"]),
    (4.9, 13, "code", "bob",
     "MCP tool registration — the schema lives in tools.py and the stdio "
     "loop in mcp_server.py. Six tools: diary_save, diary_recall, "
     "diary_link_code, diary_feedback, diary_timeline, diary_pending_actions.",
     "src/cortex-api/cortex_api/tools.py", ["mcp", "bob"]),
    (4.8, 17, "note", "bob",
     "The pending_actions queue is the killer beat — phone tap → row in "
     "sqlite → Bob picks it up at session start via diary_pending_actions. "
     "Async hand-off, full diary context attached.",
     "bob/rules-cortex/05-pending-actions.md", ["pending-actions", "queue"]),

    # ── 4 days ago — mobile design system ─────────────────────────────────
    (4.0, 10, "decision", "mobile",
     "Mobile UX: 4 icons-only tabs (Today/Search/Ask/More) with a centre "
     "Capture FAB hanging above the bar. Dropped labels because the tab "
     "bar was too noisy. Apple-style pacing.",
     "cortex-mobile/app/_layout.tsx", ["mobile", "navigation", "ux"]),
    (3.9, 14, "code", "mobile",
     "Design system primitives: Screen, Header, Card, Button, Pill, "
     "EmptyState, Section, IconButton, StatusBanner. Every one consumes "
     "useThemeMode().Colors so dark mode propagates without per-screen wiring.",
     "cortex-mobile/src/components/ui/index.ts", ["design-system", "primitives"]),
    (3.7, 16, "debug", "mobile",
     "Triangle icons in Expo Go — turned out @expo/vector-icons fonts "
     "weren't loading because the layout returned the tabs immediately "
     "instead of waiting for useFonts. Splash held until fonts ready fixes it.",
     "cortex-mobile/app/_layout.tsx", ["bug-fix", "fonts", "icons"]),

    # ── 3 days ago — feature build sprint ─────────────────────────────────
    (3.0, 9, "fix", "bob",
     "Dark mode wasn't propagating in the mobile app — every screen had "
     "`import { Colors }` from constants/theme.ts which captures the "
     "static light palette at module load. Refactored to "
     "makeStyles(Colors) pattern; theme hook gives the resolved palette.",
     "cortex-mobile/src/hooks/useThemeMode.tsx", ["dark-mode", "refactor"]),
    (2.9, 11, "code", "bob",
     "Cron scheduler — automations table now has schedule + last_run_at + "
     "run_count. tick(now_ms=None) runs synchronously for tests; "
     "run_loop(stop_event) is the asyncio daemon. croniter.is_valid "
     "validates the expression at write time → 400 instead of silent skip.",
     "src/cortex-api/cortex_api/scheduler.py", ["scheduler", "cron"]),
    (2.7, 15, "idea", "mobile",
     "Skill creator — author Bob skills FROM the mobile app. Slug + "
     "description (≥30 chars) + body, saved as bob/skills/<slug>/SKILL.md. "
     "`make install-bob` deploys to ~/.bob/. The reserved `cortex` skill "
     "is read-only.",
     "src/cortex-api/cortex_api/skills.py", ["skills", "ibm-bob", "feature"]),
    (2.5, 18, "note", "bob",
     "Wiki generator: Granite reads diary entries + indexed code chunks "
     "and writes a markdown page mirrored to docs/wiki/<slug>.md. The "
     "diary becomes the source of truth for documentation.",
     "src/cortex-api/cortex_api/wiki.py", ["wiki", "granite", "rag"]),

    # ── 2 days ago — polish ───────────────────────────────────────────────
    (2.0, 10, "fix", "bob",
     "Tightened types on Object.entries(by_action) in security.tsx — "
     "TypeScript was widening to unknown so the bar chart wouldn't "
     "compile under strict. Cast to [string, number][] inline.",
     "cortex-mobile/app/security.tsx", ["typescript", "bug-fix"]),
    (1.9, 14, "decision", "mobile",
     "One-click pairing flow: scripts/pair.py prints a QR encoding "
     "{url, token, v}. Mobile Settings → Scan to connect reads it via "
     "expo-camera, writes both fields to AsyncStorage, runs /health.",
     "scripts/pair.py", ["pairing", "qr", "ux"]),
    (1.8, 16, "code", "bob",
     "ScanToConnect modal — uses CameraView + useCameraPermissions from "
     "expo-camera (the modern API; expo-barcode-scanner is deprecated). "
     "barcodeScannerSettings={{ barcodeTypes: ['qr'] }} narrows the scan.",
     "cortex-mobile/src/components/ScanToConnect.tsx", ["expo-camera", "qr"]),

    # ── yesterday — final stretch ─────────────────────────────────────────
    (1.0, 9, "fix", "bob",
     "scripts/start.py was hanging because EMBEDDINGS_PROVIDER=local "
     "loads sentence-transformers which then blocks on a huggingface.co "
     "metadata check even when the model is fully cached. Added a `fake` "
     "provider — deterministic blake2b-bucketed 384-dim vectors, instant "
     "boot. EMBEDDINGS_PROVIDER=fake is now the demo default.",
     "src/cortex-api/cortex_api/embeddings.py", ["bug-fix", "embeddings", "boot"]),
    (0.95, 11, "fix", "bob",
     "ibm-granite/granite-3.1-2b-instruct-GGUF returns 401 — that repo "
     "isn't actually published. Switched to lmstudio-community's mirror; "
     "Q4_K_M is 1.55 GB and runs at ~25 tok/s on an M-series Mac.",
     "scripts/start.py", ["granite", "llm", "huggingface"]),
    (0.85, 13, "note", "bob",
     "tests/conftest.py needed monkeypatch for settings.llm_provider='off' — "
     "now that the local Granite GGUF is on disk, the test asserting 503 "
     "when LLM is off was getting 200 because the model loaded for real.",
     "tests/conftest.py", ["tests", "isolation"]),

    # ── today ─────────────────────────────────────────────────────────────
    (0.5, 9, "task", "web",
     "Submission TODOs — paste public video URL into SUBMISSION.md, verify "
     "docs/bob-sessions/ has each member's task-history exports, double-check "
     "the four team emails, open repo URL in incognito.",
     "SUBMISSION.md", ["submission", "todo"]),
    (0.4, 11, "decision", "mobile",
     "9:16 portrait reformat for the demo deck — mobile-first video for "
     "Reels/Shorts/TikTok. Same brand DNA, layouts collapsed to vertical "
     "stacks. Added a one-command-setup slide because nobody else will "
     "bother to install if it's not 'make start'.",
     "cortex-deck.html", ["video", "deck", "demo"]),
    (0.3, 13, "code", "bob",
     "make smoke = pytest + scripts/smoke.py. Four integration checks "
     "pytest can't see: pair payload roundtrip, install-bob to tmp "
     "BOB_HOME, mobile tsc --noEmit, mobile parser shape negative cases. "
     "All four green in 3.5s on top of 124 pytest cases.",
     "scripts/smoke.py", ["testing", "ci"]),
    (0.2, 14, "note", "bob",
     "watsonx.ai vs local Granite tradeoff: cloud is faster + smarter "
     "for long-tail queries but adds a network hop and a credential "
     "dependency. Local is private + offline + good enough for diary RAG. "
     "Defaulting to local; users can flip to watsonx with creds.",
     "src/cortex-api/cortex_api/llm.py", ["granite", "watsonx", "tradeoff"]),
    (0.15, 15, "note", "mobile",
     "Hackathon submission deadline: today, May 3 2026. Repo is at "
     "github.com/equinox12311/IBM-Bob. Video is 3 minutes max, public URL.",
     None, ["submission", "deadline"]),
    (0.1, 16, "idea", "mobile",
     "Future: agentic auto-capture. When Bob completes a task, mode rule "
     "04 proposes a draft entry summarising what was done and why; one "
     "tap confirms. Captures the 'why' that's normally lost between "
     "commits.",
     "bob/rules-cortex/04-agentic-auto-capture.md", ["future", "agentic"]),
    (0.05, 17, "task", "mobile",
     "Run `make smoke` once more and pair the phone with `make pair` "
     "before recording the video.",
     None, ["demo-prep"]),
]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--keep-existing",
        action="store_true",
        help="Don't clear previous seed:demo entries before inserting.",
    )
    args = parser.parse_args()

    print(f"  diary db:  {settings.diary_db_path}")
    print(f"  embed:     {get_provider().name} (dim={get_provider().dim})")
    print()

    storage.init_db(embedding_dim=get_provider().dim)
    provider = get_provider()

    if not args.keep_existing:
        before = _count_seeded()
        if before:
            _delete_seeded()
            print(f"  cleared {before} prior seed:demo entries")

    inserted = 0
    for days_ago, hour, kind, source, text, file, tags in ENTRIES:
        all_tags = list(tags) + [SEED_TAG]
        ts = ms(days_ago, hour=hour, minute=random.randint(0, 59))
        emb = provider.embed(text)

        # Hand-craft the INSERT so we can override created_at; insert_entry
        # always uses now_ms() and we want spread for Today/Calendar.
        with sqlite3.connect(settings.diary_db_path) as conn:
            tags_csv = ",".join(all_tags)
            cur = conn.execute(
                "INSERT INTO entries "
                "(text, created_at, source, kind, repo, file, line_start, line_end, tags) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (text, ts, source, kind, None, file, None, None, tags_csv),
            )
            entry_id = cur.lastrowid
            try:
                conn.execute(
                    "INSERT INTO vec_entries(rowid, embedding) VALUES (?, ?)",
                    (entry_id, storage._pack_floats(emb)),  # noqa: SLF001
                )
            except sqlite3.OperationalError:
                pass  # vec extension unavailable; that's fine
        inserted += 1

    after = _count_seeded()
    print(f"  ✓ seeded {inserted} entries  (total seed:demo in db: {after})")
    print()
    print("  Open Today / Timeline on the phone — recent activity is now lived-in.")
    return 0


def _count_seeded() -> int:
    with sqlite3.connect(settings.diary_db_path) as conn:
        cur = conn.execute(
            "SELECT COUNT(*) FROM entries WHERE tags LIKE ?", (f"%{SEED_TAG}%",)
        )
        return int(cur.fetchone()[0])


def _delete_seeded() -> None:
    with sqlite3.connect(settings.diary_db_path) as conn:
        cur = conn.execute(
            "SELECT id FROM entries WHERE tags LIKE ?", (f"%{SEED_TAG}%",)
        )
        ids = [row[0] for row in cur.fetchall()]
        if not ids:
            return
        placeholders = ",".join("?" * len(ids))
        conn.execute(f"DELETE FROM entries WHERE id IN ({placeholders})", ids)
        try:
            conn.execute(f"DELETE FROM vec_entries WHERE rowid IN ({placeholders})", ids)
        except sqlite3.OperationalError:
            pass


if __name__ == "__main__":
    sys.exit(main())
