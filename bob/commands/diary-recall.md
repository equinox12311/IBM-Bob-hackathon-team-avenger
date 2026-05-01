---
description: Search the Cortex dev journal for entries relevant to a topic
argument-hint: <topic — what to recall>
---

Use the `cortex` MCP server's `diary_recall` tool to find past entries relevant to `$1`.

1. Call `diary_recall` with `query=$1` and `k=5`.
2. Render the top results in this format, ranked by `score`:
   ```
   #<id>  (<source>, <relative-time>)
       <text>
       <repo>/<file>:<line_start>-<line_end>   ← when present
   ```
3. If the user acts on a specific entry's information, ask whether it helped.
   - If yes, call `diary_feedback(id, "boost")`.
   - If it was wrong or outdated, call `diary_feedback(id, "flag")`.
