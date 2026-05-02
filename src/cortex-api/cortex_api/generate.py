"""LLM-backed flows: chat (RAG), summarise, and report-narrate.

Each function composes the right prompt around real diary context so the
LLM grounds its output in the user's actual entries instead of hallucinating.
"""

from __future__ import annotations

from datetime import datetime, timezone

from cortex_api import features, storage
from cortex_api.llm import Message, get_provider
from cortex_api.models import Entry
from cortex_api.retrieval import recall

SYSTEM_PROMPT = (
    "You are Cortex, a developer's persistent journal. "
    "Answer concisely, cite entry IDs as [#42] when grounding a claim in a journal entry, "
    "and never fabricate entries. If the journal has nothing relevant, say so."
)


# ---------- chat / RAG -----------------------------------------------------


def chat(query: str, k: int = 5) -> dict:
    """RAG-style chat: retrieve top-k entries, then complete with citations."""

    hits = recall(query=query, k=k)
    context = _format_hits_for_prompt(hits)

    user_prompt = (
        f"Journal context:\n{context}\n\n"
        f"Question: {query}\n\n"
        "Answer in 2-4 sentences. Cite entry IDs as [#N] for any specific claim."
    )

    provider = get_provider()
    answer = provider.complete(
        [
            Message(role="system", content=SYSTEM_PROMPT),
            Message(role="user", content=user_prompt),
        ],
        max_tokens=400,
        temperature=0.3,
    )
    return {
        "answer": answer,
        "citations": [{"id": h.id, "text": h.text[:200], "score": h.score} for h in hits],
        "model": provider.name,
    }


# ---------- summarise an entry ---------------------------------------------


def summarise_entry(entry_id: int, max_words: int = 30) -> str:
    entry = storage.get_entry(entry_id)
    if entry is None:
        raise LookupError(f"entry {entry_id} not found")

    provider = get_provider()
    return provider.complete(
        [
            Message(role="system", content=SYSTEM_PROMPT),
            Message(
                role="user",
                content=(
                    f"Summarise this journal entry in {max_words} words or fewer, "
                    f"in the developer's voice (past tense, specific):\n\n{entry.text}"
                ),
            ),
        ],
        max_tokens=120,
        temperature=0.2,
    ).strip()


# ---------- narrative daily report -----------------------------------------


def daily_report_narrative(days: int = 1, max_sentences: int = 4) -> dict:
    report = features.daily_report(days=days)
    if report.total_entries == 0:
        return {"narrative": "No journal entries in this range yet.", "model": "n/a"}

    provider = get_provider()
    bullets = "\n".join(f"- [#{e.id}] {e.text[:200]}" for e in report.highlights)
    user_prompt = (
        f"Here are the highest-scored entries from the last {days} day(s):\n"
        f"{bullets}\n\n"
        f"Counts by kind: {dict(report.by_kind)}\n\n"
        f"Write a {max_sentences}-sentence narrative summary of what the developer "
        f"learned and shipped. Cite entry IDs as [#N]. Keep it factual."
    )
    narrative = provider.complete(
        [
            Message(role="system", content=SYSTEM_PROMPT),
            Message(role="user", content=user_prompt),
        ],
        max_tokens=300,
        temperature=0.3,
    )
    return {
        "narrative": narrative.strip(),
        "date_start": report.date_start,
        "date_end": report.date_end,
        "total_entries": report.total_entries,
        "model": provider.name,
    }


# ---------- helpers --------------------------------------------------------


def _format_hits_for_prompt(hits: list[Entry]) -> str:
    if not hits:
        return "(no matching entries)"
    lines = []
    for h in hits:
        ts = datetime.fromtimestamp(h.created_at / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
        ref = ""
        if h.file:
            ref = f" — {h.file}" + (f":{h.line_start}" if h.line_start else "")
        lines.append(f"[#{h.id}] ({h.kind}, {ts}){ref}\n  {h.text}")
    return "\n".join(lines)
