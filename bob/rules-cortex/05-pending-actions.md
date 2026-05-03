# Pending actions queue (mobile → Bob handoff)

When a developer is away from their IDE — on the bus, in a meeting, on their
phone — they may queue actions for IBM Bob to act on next time they sit down.

These actions live in the Cortex `pending_actions` queue and are exposed via
the **`diary_pending_actions`** MCP tool.

## When to call

**At the very start of every Bob session in this workspace**, call
`diary_pending_actions` (with the default `consume=true`). If the response is
non-empty, surface the queued actions to the developer immediately, before
their first prompt is acted on.

## How to surface

Print one short line per action, prefixed with where it came from:

> 📩 **2 queued from mobile:**
> 1. *Recall* — "auth context bug"
> 2. *Save* — "Reverted webhook retry to exponential backoff"

Then ask the developer how to proceed: act on each one, dismiss, or treat
them as informational.

If `count == 0`, **stay silent** — do not announce the absence of queued
actions; that's noise.

## Action kinds

| `kind` | Payload shape | What Bob should do |
|---|---|---|
| `recall` | `{"query": "…", "k"?: 5}` | Call `diary_recall` with the query and surface the top results |
| `save` | `{"text": "…", "kind"?: "note", …}` | Propose a `diary_save` with that text; ask the developer to confirm |
| `analyze` | `{"file": "…", "question": "…"}` | If the codebase is indexed, call `diary_recall` filtered to that file's entries; otherwise fall back to summarising the file's diary entries |
| `free` | `{"prompt": "…"}` | Treat the prompt as if the developer just typed it — answer normally, with diary context |

## Idempotency

`consume=true` marks actions as picked up so a long Bob session does not
re-surface them. To debug, the REST endpoint `GET /api/v1/actions/all`
returns both consumed and pending actions.

## Hand-off back to mobile

After acting on a `save` action, if the developer confirmed, the resulting
`diary_save` will appear in the mobile app's Timeline immediately (shared
SQLite). Loop closed.
