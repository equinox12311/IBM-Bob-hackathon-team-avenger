---
description: Search the Cortex dev journal for entries relevant to a topic
argument-hint: <topic — what to recall>
---

Use the `cortex` MCP server's `diary_recall` tool to find past entries relevant to `$1`.

1. Call `diary_recall` via `use_mcp_tool` with `query=$1` and `k=5`.
2. Render the top results, one per line, ordered by `score`:
   ```
   #<id>  (<source>, <relative-time>)
       <text>
       <repo>/<file>:<line_start>-<line_end>   ← when present
   ```
3. After the developer acts on information from a specific entry, ask:
   - "Was that helpful?" → call `diary_feedback(id, "boost")`
   - "Stale or wrong?" → call `diary_feedback(id, "flag")`
4. If `diary_recall` returns no entries, just say "(no matches)" — don't fabricate results.
