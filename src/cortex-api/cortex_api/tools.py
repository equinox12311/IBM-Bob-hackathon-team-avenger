"""MCP tool definitions for the Cortex MCP server.

Each tool is a thin wrapper that delegates to the same handlers the REST API
uses, keeping a single source of truth. Bob calls these via ``use_mcp_tool``.
"""

from __future__ import annotations

import json
from typing import Any

from cortex_api import storage
from cortex_api.embeddings import get_provider
from cortex_api.models import EntrySource, FeedbackSignal
from cortex_api.retrieval import recall as retrieval_recall
from cortex_api.secrets import detect_secrets

# Tool descriptions are written so that Bob picks the right one based on the
# user's prompt. Keep them concrete; vague descriptions cause mis-routing.

TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "name": "diary_save",
        "description": (
            "Save a developer journal entry. Use when the developer has a learning, "
            "decision, or insight worth remembering. Refuses to save text containing "
            "AWS keys, GitHub tokens, JWTs, or other secrets."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "The entry body."},
                "source": {
                    "type": "string",
                    "enum": ["bob", "telegram-text", "telegram-voice", "web"],
                    "default": "bob",
                },
                "repo": {"type": "string"},
                "file": {"type": "string"},
                "line_start": {"type": "integer"},
                "line_end": {"type": "integer"},
                "tags": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["text"],
        },
    },
    {
        "name": "diary_recall",
        "description": (
            "Search the developer journal for entries relevant to a topic. Returns the "
            "top-k entries ordered by relevance, with file:line citations when present."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "k": {"type": "integer", "default": 5, "minimum": 1, "maximum": 25},
            },
            "required": ["query"],
        },
    },
    {
        "name": "diary_timeline",
        "description": "Return the most recent journal entries (reverse-chronological).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "default": 10, "minimum": 1, "maximum": 50},
                "since": {
                    "type": "integer",
                    "description": "Optional unix epoch ms cutoff; only entries created after.",
                },
            },
        },
    },
    {
        "name": "diary_link_code",
        "description": (
            "Attach repo/file:line metadata to an existing entry. Use when the entry was "
            "saved without code context but later relates to a specific location."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "entry_id": {"type": "integer"},
                "repo": {"type": "string"},
                "file": {"type": "string"},
                "line_start": {"type": "integer"},
                "line_end": {"type": "integer"},
            },
            "required": ["entry_id", "repo", "file", "line_start", "line_end"],
        },
    },
    {
        "name": "diary_feedback",
        "description": (
            "Boost or flag a recalled entry to shape future ranking. "
            "Boost (+0.2) when an entry helped; flag (-0.3) when it was wrong/outdated."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "entry_id": {"type": "integer"},
                "signal": {"type": "string", "enum": ["boost", "flag"]},
            },
            "required": ["entry_id", "signal"],
        },
    },
    {
        "name": "diary_pending_actions",
        "description": (
            "Pop the queue of actions enqueued by the developer's mobile or web client. "
            "Call this once at the start of every Bob session — if it returns any actions, "
            "surface them and offer to execute. Pass consume=true (default) to mark them "
            "as picked up so they are not surfaced again."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "consume": {"type": "boolean", "default": True},
                "limit": {"type": "integer", "default": 10, "minimum": 1, "maximum": 50},
            },
        },
    },
]


# ---------- handlers (called by mcp_server.py) -----------------------------


def call_tool(name: str, arguments: dict[str, Any]) -> str:
    """Dispatch a tool call. Returns a JSON-encoded string for MCP transport."""

    if name == "diary_save":
        result = _diary_save(arguments)
    elif name == "diary_recall":
        result = _diary_recall(arguments)
    elif name == "diary_timeline":
        result = _diary_timeline(arguments)
    elif name == "diary_link_code":
        result = _diary_link_code(arguments)
    elif name == "diary_feedback":
        result = _diary_feedback(arguments)
    elif name == "diary_pending_actions":
        result = _diary_pending_actions(arguments)
    else:
        result = {"error": f"unknown tool: {name}"}
    return json.dumps(result, default=str)


def _diary_pending_actions(args: dict[str, Any]) -> dict[str, Any]:
    consume = bool(args.get("consume", True))
    limit = int(args.get("limit", 10))
    rows = storage.list_pending_actions(consume=consume, limit=limit)
    return {
        "actions": [
            {
                "id": r["id"],
                "kind": r["kind"],
                "payload": json.loads(r["payload"]) if r["payload"] else {},
                "source": r["source"],
                "created_at": r["created_at"],
            }
            for r in rows
        ],
        "consumed": consume,
        "count": len(rows),
    }


def _diary_save(args: dict[str, Any]) -> dict[str, Any]:
    text = args["text"]
    findings = detect_secrets(text)
    if findings:
        return {
            "error": "secret_detected",
            "findings": [
                {"label": f.label, "snippet": f.snippet} for f in findings
            ],
        }

    source: EntrySource = args.get("source", "bob")
    embedding = get_provider().embed(text)
    entry_id, created_at = storage.insert_entry(
        text=text,
        source=source,
        embedding=embedding,
        repo=args.get("repo"),
        file=args.get("file"),
        line_start=args.get("line_start"),
        line_end=args.get("line_end"),
        tags=args.get("tags") or (),
    )
    return {"id": entry_id, "created_at": created_at}


def _diary_recall(args: dict[str, Any]) -> dict[str, Any]:
    entries = retrieval_recall(query=args["query"], k=int(args.get("k", 5)))
    return {"entries": [e.model_dump() for e in entries]}


def _diary_timeline(args: dict[str, Any]) -> dict[str, Any]:
    limit = int(args.get("limit", 10))
    since = args.get("since")
    entries = storage.list_recent(
        limit=limit,
        since_ms=int(since) if since is not None else None,
    )
    return {"entries": [e.model_dump() for e in entries]}


def _diary_link_code(args: dict[str, Any]) -> dict[str, Any]:
    entry_id = int(args["entry_id"])
    if storage.get_entry(entry_id) is None:
        return {"error": "entry not found", "id": entry_id}
    storage.link_code(
        entry_id,
        repo=args["repo"],
        file=args["file"],
        line_start=int(args["line_start"]),
        line_end=int(args["line_end"]),
    )
    return {"id": entry_id}


def _diary_feedback(args: dict[str, Any]) -> dict[str, Any]:
    entry_id = int(args["entry_id"])
    signal: FeedbackSignal = args["signal"]
    try:
        new_score = storage.apply_feedback(entry_id, signal)
    except LookupError as exc:
        return {"error": str(exc), "id": entry_id}
    return {"id": entry_id, "score": new_score}
