# Proactive recall (innovation)

When the developer opens or focuses a file you have not yet considered in this session, **automatically call** `diary_recall`. Limit to one proactive recall per file per session.

## How to derive the query

Build a query string from:

1. The relative file path (e.g. `cortex-api/cortex_api/storage.py`)
2. The file's primary topic if obvious (the most prominent class or function name visible in the buffer)
3. Tags or keywords from a one-line file docstring if present

Example: opening `cortex-api/cortex_api/storage.py` with `class StorageError` near the top → query becomes `"cortex-api storage StorageError"`.

## What to surface

If `diary_recall` returns one or more entries with `score > 0.5`, surface them with a single short header:

> 📓 Cortex has *N* related entries for this file —

Then list the top 3, citing `file:line` where present. Keep entries to 1–2 lines each in the surface; the developer can click into details.

If proactive recall returns nothing, **stay silent**. Do not announce the absence of entries — that would be noise.

## Thresholds

- Threshold for "relevant": `score > 0.5` after the cortex re-ranker (`final_score = entry.score · exp(-λ·days) · cosine_sim`).
- Maximum 3 entries surfaced per file-open.
- Maximum 1 proactive recall per file per session.

## Don't interrupt

This is *informational*. Do not pause the developer's current task or demand acknowledgement. The surfaced block is read at-a-glance; the dev moves on or clicks in.
