---
description: Save the current insight to your Cortex dev journal
argument-hint: <text — the insight to save>
---

Use the `cortex` MCP server to save the user's input as a diary entry.

1. Take the user-provided text in `$1` (or, if empty, summarise the current Bob conversation context into one focused, fact-dense sentence).
2. Call `diary_save` with:
   - `text`: the captured insight
   - `source`: `"bob"`
   - `repo`, `file`, `line_start`, `line_end`: include if there is an obvious code reference in the conversation
3. Confirm with the user, citing the new entry id returned by the tool.

Refuse to save if the text contains anything matching common secret patterns (AWS access keys, GitHub PATs, JWTs, OAuth tokens). Tell the user why.
