---
description: Show the most recent Cortex dev journal entries
argument-hint: [limit — default 10]
---

Use the `cortex` MCP server's `diary_timeline` tool to fetch the most recent entries (default `limit=10`, override via `$1`).

Render the result as a brief reverse-chronological list, one entry per line:
```
#<id>  <relative-time>  (<source>)  <first 80 chars>
```
