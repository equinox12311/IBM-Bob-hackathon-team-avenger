---
name: cortex
description: Capture and recall developer journal entries via the Cortex MCP server. Use when the developer is solving a problem, making a decision, or learning something worth remembering, OR when opening a file that may have past entries linked to it, OR when a meaningful task completes (test passes, bug fixed, refactor landed) and the discovery is worth journaling.
---

# Cortex skill

Cortex is the developer's persistent journal. Entries are captured and recalled via five MCP tools exposed by the `cortex-api` MCP server (configured separately — see `bob/MCP_CONFIG.md`).

## Tools you will call

| Tool | When |
|---|---|
| `diary_save` | When something worth remembering just happened |
| `diary_recall` | When the developer asks "why did we…", "what did I learn about…", or you proactively detect a relevant past entry on file-open |
| `diary_link_code` | When an entry was saved without code context but later relates to a specific file:line |
| `diary_feedback` | After a recalled entry was either useful (`boost`) or wrong (`flag`) |
| `diary_timeline` | "What did I learn this week?" or as a session-warmup glance |

## When to capture (`diary_save`)

Propose a save when any of these happen in conversation:

- A bug is **resolved** and the root cause is now clear
- A **design decision** is made (e.g. "we picked Postgres over MySQL because…")
- A "tried this didn't work" learning happens (a fast-failing experiment)
- A non-obvious fact about the codebase is **discovered**
- A test that was failing now passes — capture *what fixed it*, not just "fixed"
- A refactor lands and the *reasoning* would help future-you

Do NOT save:
- Routine status updates ("running tests now")
- Things obvious from the code or commit message
- Anything containing secrets — see `../../rules-cortex/02-no-secrets.md`

## When to recall (`diary_recall`)

**Proactive (always do this first thing in a session, then once per file-open):**
- On file-open, query `diary_recall` with the file path + visible class/function names
- If results have score > 0.5, surface them with a short header — see `../../rules-cortex/03-proactive-recall.md`

**Reactive (responding to the developer's prompt):**
- They ask a "why" or "how did we" question — query with their phrase
- They mention a topic that may have been touched before — query the topic
- Before generating new code in an unfamiliar area — query the area first

## How to format an entry on save

Specific over generic:

| ❌ Bad | ✅ Good |
|---|---|
| "fixed connection pool" | "max_connections raised from 20 to 50 because pool exhaustion was hitting at >100 RPS" |
| "tested with Carbon" | "Carbon `<HeaderMenuItem>` doesn't accept `as` prop in v1.71; used a wrapping `<Link>` instead" |
| "refactor done" | "extracted retrieval re-ranking from server.py into retrieval.py so the MCP server and REST share the formula" |

When the entry is about a code change, include `repo`, `file`, `line_start`, and `line_end` arguments to `diary_save` so the diary entry has a clickable citation later.

## After a recall, complete the loop

If the developer acts on a returned entry, ask:
- "Was that helpful?" → if yes, call `diary_feedback(entry_id, "boost")`
- "Did that work, or was it stale?" → if stale, call `diary_feedback(entry_id, "flag")`

The diary "evolves" via these signals. See `../../rules-cortex/03-proactive-recall.md` for thresholds.

## Examples

See `examples.md` (in this same directory) for full conversation transcripts demonstrating capture, recall, and feedback flows.
