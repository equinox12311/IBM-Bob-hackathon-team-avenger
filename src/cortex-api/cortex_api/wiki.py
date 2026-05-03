"""Wiki — auto-generated docs grounded in diary entries + indexed code.

Pages live as ``kind="wiki"`` entries (file=<slug>.md) so they are
searchable through the existing recall pipeline. Optionally mirrored
to ``docs/wiki/<slug>.md`` on disk so they show up in the repo too.
"""

from __future__ import annotations

import logging
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from cortex_api import storage
from cortex_api.config import settings
from cortex_api.embeddings import get_provider
from cortex_api.llm import Message, get_provider as get_llm
from cortex_api.retrieval import recall

log = logging.getLogger(__name__)

WIKI_SYSTEM_PROMPT = (
    "You are Cortex's wiki author. You write concise, factual Markdown "
    "documentation grounded only in the journal entries and source-code chunks "
    "the user provides. Cite entries as [#42] and source chunks as `path L12-L40`. "
    "Never invent APIs, endpoints, or behaviours not in the context."
)


def _slugify(text: str) -> str:
    s = re.sub(r"[^\w\s-]", "", text.strip().lower())
    s = re.sub(r"[\s_-]+", "-", s).strip("-")
    return s[:80] or "untitled"


def _disk_path(slug: str) -> Path:
    """Where to mirror wiki pages on disk for the team to commit."""
    return settings.diary_db_path.parent.parent / "docs" / "wiki" / f"{slug}.md"


# ---------- list / get -----------------------------------------------------


def list_pages() -> list[dict]:
    """List wiki pages — one row per slug (newest revision wins)."""

    raw = storage.list_recent(limit=10_000, kind="wiki")
    # Force newest-first regardless of underlying storage ordering
    entries = sorted(raw, key=lambda e: (e.created_at, e.id), reverse=True)
    seen: dict[str, dict] = {}
    for e in entries:
        slug = (e.file or "").removesuffix(".md")
        if not slug:
            continue
        if slug not in seen:
            title = _title_from_body(e.text) or slug.replace("-", " ").title()
            seen[slug] = {
                "slug": slug,
                "title": title,
                "updated_at": e.created_at,
                "tags": e.tags or [],
                "id": e.id,
                "preview": e.text[:200],
            }
    return list(seen.values())


def get_page(slug: str) -> dict | None:
    entries = storage.list_recent(limit=10_000, kind="wiki")
    for e in entries:
        if (e.file or "").removesuffix(".md") == slug:
            return {
                "slug": slug,
                "title": _title_from_body(e.text) or slug,
                "body": e.text,
                "updated_at": e.created_at,
                "id": e.id,
                "tags": e.tags or [],
            }
    return None


# ---------- generate (Granite-backed) -------------------------------------


def generate_page(
    topic: str,
    *,
    sources: list[str] | None = None,
    k_entries: int = 6,
    k_code: int = 6,
) -> dict:
    """Generate a wiki page on ``topic`` using diary + indexed code as context.

    ``sources`` is an optional whitelist; default ["entries", "code"].
    Persists the result as a kind="wiki" entry and (best-effort) mirrors to
    ``docs/wiki/<slug>.md`` on disk.
    """

    use = set(sources or ["entries", "code"])
    diary_hits: list = []
    code_hits: list = []

    if "entries" in use:
        all_recall = recall(query=topic, k=k_entries * 2)
        diary_hits = [e for e in all_recall if e.kind != "code"][:k_entries]
    if "code" in use:
        all_code = recall(query=topic, k=k_code * 2)
        code_hits = [e for e in all_code if e.kind == "code"][:k_code]

    diary_block = _format_entries(diary_hits) or "(no relevant journal entries)"
    code_block = _format_code(code_hits) or "(no relevant code chunks)"

    user_prompt = (
        f"Write a Markdown wiki page on **{topic}**.\n\n"
        f"Journal context:\n{diary_block}\n\n"
        f"Source-code context:\n{code_block}\n\n"
        "Structure:\n"
        "1. `# <Title>` (concise; 5-8 words)\n"
        "2. 2-sentence overview\n"
        "3. `## Key points` — 3-5 bullets, each with [#N] or `path L12-L40` citations\n"
        "4. `## Examples` — only if context contains concrete code/decisions; otherwise omit\n"
        "5. `## Related entries` — bullet list of cited [#ids]\n\n"
        "Do not fabricate APIs or behaviours not in the context. If context is thin, say so explicitly."
    )

    provider = get_llm()
    body = provider.complete(
        [
            Message(role="system", content=WIKI_SYSTEM_PROMPT),
            Message(role="user", content=user_prompt),
        ],
        max_tokens=900,
        temperature=0.3,
    ).strip()

    slug = _slugify(topic)
    title = _title_from_body(body) or topic

    # Embed + persist as kind="wiki"
    embed_provider = get_provider()
    storage.init_db(embedding_dim=embed_provider.dim)
    embedding = embed_provider.embed(body)
    entry_id, created_at = storage.insert_entry(
        text=body,
        source="web",
        embedding=embedding,
        kind="wiki",
        repo=str(settings.diary_db_path.parent.parent),
        file=f"{slug}.md",
        tags=[*_topic_tags(topic), "wiki"],
    )

    # Best-effort filesystem mirror
    disk_status = "skipped"
    try:
        out = _disk_path(slug)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(body + "\n", encoding="utf-8")
        disk_status = str(out)
    except OSError as exc:
        log.warning("wiki disk mirror failed: %s", exc)

    return {
        "slug": slug,
        "title": title,
        "body": body,
        "id": entry_id,
        "created_at": created_at,
        "model": provider.name,
        "diary_count": len(diary_hits),
        "code_count": len(code_hits),
        "disk_path": disk_status,
    }


# ---------- helpers --------------------------------------------------------


def _title_from_body(body: str) -> str | None:
    for line in body.splitlines():
        s = line.strip()
        if s.startswith("# "):
            return s[2:].strip()
    return None


def _topic_tags(topic: str) -> list[str]:
    return [w for w in re.findall(r"[a-z0-9]+", topic.lower()) if len(w) > 2][:5]


def _format_entries(hits: list) -> str:
    parts = []
    for h in hits:
        ts = datetime.fromtimestamp(h.created_at / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
        ref = f" — {h.file}" if h.file else ""
        parts.append(f"[#{h.id}] ({h.kind}, {ts}){ref}\n  {h.text[:300]}")
    return "\n".join(parts)


def _format_code(hits: list) -> str:
    parts = []
    for h in hits:
        loc = f"{h.file} L{h.line_start}-L{h.line_end}" if h.line_start else (h.file or "?")
        parts.append(f"```\n# {loc}\n{h.text[:400]}\n```")
    return "\n".join(parts)
