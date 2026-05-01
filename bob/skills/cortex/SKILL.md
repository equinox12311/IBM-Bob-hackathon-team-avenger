---
name: cortex
description: Capture and recall developer journal entries via the Cortex MCP server. Use when the developer is solving a problem, making a decision, or learning something worth remembering, OR when opening a file that may have past entries linked to it.
---

# Cortex skill

Cortex is the developer's persistent journal. Entries are captured and recalled via MCP tools exposed by the `cortex-api` server.

## When to capture

Propose a `diary_save` when:
- A bug is resolved and the root cause is now clear
- A design decision is made (e.g. "we picked Postgres over MySQL because…")
- A "tried this didn't work" learning happens
- A non-obvious fact about the codebase is discovered

## When to recall

Call `diary_recall` proactively when:
- The developer opens a file that has been touched before in entries
- The developer's prompt mentions a topic that may have past entries
- The developer asks "why did we…" or "what did we decide…"

## How to format entries

- Specific over generic: "max_connections raised from 20 to 50 to fix pool exhaustion under load > 100 RPS" beats "fixed connection pool"
- Cite file:line when relevant
- Avoid secrets — Cortex's secret-detection middleware will refuse them anyway
- Keep entries to 1–3 sentences; longer captures go in code comments

## Feedback loop

When recalling an entry, after the developer acts on it:
- If it helped: call `diary_feedback(entry_id, "boost")`
- If it was wrong or outdated: call `diary_feedback(entry_id, "flag")`
