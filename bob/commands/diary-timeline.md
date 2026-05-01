---
description: Show the most recent Cortex dev journal entries
argument-hint: [limit — default 10]
---

Use the `cortex` MCP server's `diary_timeline` tool to fetch the most recent entries.

- Default `limit=10`; if `$1` is provided and parses as an integer, use it (clamp to 1–50).
- Call `diary_timeline` via `use_mcp_tool` with the chosen limit.
- Render the result as a brief reverse-chronological list, one entry per line:
  ```
  #<id>  <relative-time>  (<source>)  <first 80 chars>
  ```
- Group consecutive same-day entries under a date header for readability.
