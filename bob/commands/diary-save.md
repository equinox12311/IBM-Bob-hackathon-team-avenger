---
description: Save the current insight to your Cortex dev journal
argument-hint: <text — the insight to save>
---

Use the `cortex` MCP server to save the user's input as a diary entry.

1. Take the user-provided text in `$1`. If empty, summarise the current Bob conversation context into one focused, fact-dense sentence in the developer's voice (past tense, specific, ≤2 sentences).
2. Run a local secret-detection check (see `.bob/rules-cortex/02-no-secrets.md`). If the text matches AWS keys / GitHub tokens / JWTs / OAuth secrets / private key blocks → REFUSE to save and explain why.
3. If a code reference is obvious in the conversation (e.g., the developer just edited `cortex-api/cortex_api/storage.py:42`), include it as `repo`, `file`, `line_start`, `line_end` arguments.
4. Call `diary_save` via `use_mcp_tool` with:
   - `text`: the captured insight
   - `source`: `"bob"`
   - optional code reference fields
5. Confirm with the user, citing the new entry id returned by the tool. One short line is enough — the user just wants confirmation, not a re-summary.
