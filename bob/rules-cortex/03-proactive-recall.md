# Proactive recall

When the developer opens or focuses a file you have not yet considered in this session, **automatically call** `diary_recall` with a query derived from:

- the relative file path (e.g. `cortex-api/cortex_api/storage.py`)
- the file's primary topic if obvious (function/class names visible in the buffer)

Limit to one proactive recall per file per session. If the recall returns one or more entries with `score > 0.5`, surface them to the developer with a single short header:

> 📓 Cortex has 3 related entries for this file — reviewing.

Then list the top 3, citing `file:line` where present. Do not interrupt the developer's current task; this is informational.

If proactive recall returns nothing, stay silent — do not announce the absence of entries.
