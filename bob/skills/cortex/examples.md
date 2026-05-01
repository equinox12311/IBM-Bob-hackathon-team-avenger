# Cortex skill — concrete examples

These are short conversation transcripts showing what the cortex skill does well. Use them as templates.

## Example 1 — capture after a bug fix

> **Developer:** finally — the connection pool issue is fixed. raised max_connections from 20 to 50 in pgbouncer.ini and restarted; the 503s under load are gone.
>
> **Bob (Cortex mode):** That's a good learning to keep. Want me to save this as a diary entry? I'd phrase it: *"Connection pool exhaustion under >100 RPS load was fixed by raising pgbouncer max_connections from 20 to 50."* Linked to `pgbouncer.ini:14`.
>
> **Developer:** yes save it
>
> **Bob:** Saved as #42.

## Example 2 — proactive recall on file-open

> **Developer:** *(opens `cortex-api/cortex_api/storage.py`)*
>
> **Bob (Cortex mode):** 📓 I have 2 related Cortex entries for this file —
>
> ```
> #11 (bob, 3 days ago): Re-ranking lambda is per-day not per-hour;
>     tested with 0.05 (too aggressive) before settling on 0.005.
>     📍 cortex-api/cortex_api/retrieval.py:18
>
> #19 (bob, yesterday): sqlite-vec MATCH requires `AND k = ?` in the WHERE
>     clause; without it returns the whole table.
>     📍 cortex-api/cortex_api/storage.py:165
> ```

## Example 3 — recall on demand + feedback

> **Developer:** why did we use sentence-transformers as the fallback again?
>
> **Bob:** Calling `diary_recall("sentence-transformers fallback")` …
>
> ```
> #7 (bob, 2 days ago): Local fallback uses MiniLM-L6-v2 because the dim
>     (384) matches our default watsonx model — switching providers doesn't
>     require recreating the vec_entries virtual table.
> ```
>
> **Developer:** right, that's the reason. thanks
>
> **Bob:** Boosted entry #7. (`diary_feedback(7, "boost")`)

## Example 4 — agentic auto-capture after task completion

> **Developer:** *(test that was failing now passes)*
>
> **Bob:** Test `test_search_ranks_recent_higher` is passing. The fix was switching from L2 to cosine in the re-ranker. Worth journaling. Save as: *"Re-ranking math needed cosine, not raw L2 distance: with normalised vectors L2 ≈ 0 for identical, but cosine gives intuitive 0–1 scores for downstream display."* Linked to `cortex-api/cortex_api/storage.py:212-220`?
>
> **Developer:** yes
>
> **Bob:** Saved as #58.
