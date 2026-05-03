"""Cron-style scheduler for automations — v0.3 polish.

Runs as an asyncio task on the FastAPI lifespan. Every ``TICK_SECONDS`` it:

  1. Loads enabled automations whose ``schedule`` (a 5-field cron expression)
     has fired since their ``last_run_at``.
  2. Dispatches the action by ``trigger_kind``:
       - ``notify``  → audit-log only (mobile/web can poll the audit feed)
       - ``recall``  → enqueues a ``recall`` action on pending_actions for Bob
       - ``report``  → generates a daily report and queues the narrative

The scheduler is best-effort: if croniter is missing or a job throws, we log
and skip. The point is to demo the loop, not a production scheduler.
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any

from cortex_api import storage

log = logging.getLogger(__name__)

TICK_SECONDS = 30
SUPPORTED_KINDS = {"notify", "recall", "report"}


def _parse_cron(expr: str, anchor_ms: int) -> int | None:
    """Return the next fire time (ms) at or after ``anchor_ms``, or None.

    None means croniter isn't installed or the expression is invalid.
    """

    try:
        from croniter import croniter
    except ImportError:
        log.warning("croniter not installed; scheduler is a no-op")
        return None
    try:
        anchor = datetime.fromtimestamp(anchor_ms / 1000, tz=timezone.utc)
        it = croniter(expr, anchor)
        nxt = it.get_next(datetime)
        return int(nxt.timestamp() * 1000)
    except Exception as e:
        log.warning("bad cron expression %r: %s", expr, e)
        return None


def _is_due(automation: dict, now_ms: int) -> bool:
    """True if the automation should fire on this tick."""

    schedule = (automation.get("schedule") or "").strip()
    if not schedule:
        return False
    last = automation.get("last_run_at") or automation.get("created_at") or now_ms
    nxt = _parse_cron(schedule, last)
    if nxt is None:
        return False
    return nxt <= now_ms


def _dispatch(automation: dict) -> dict[str, Any]:
    """Run one automation's action; return a small result dict for logs."""

    kind = (automation.get("trigger_kind") or "").lower()
    action = automation.get("action") or ""
    name = automation.get("name") or f"automation-{automation['id']}"

    if kind not in SUPPORTED_KINDS:
        log.info("skipping unsupported trigger_kind=%s for %s", kind, name)
        return {"status": "skipped", "reason": f"unsupported kind {kind}"}

    if kind == "notify":
        # Pure audit: the mobile/web audit feed surfaces these as toasts.
        storage.append_audit(
            actor="scheduler",
            action="automation.fired",
            target=name,
            note=action,
        )
        return {"status": "notified"}

    if kind == "recall":
        # Queue a recall request that Bob picks up via diary_pending_actions.
        payload = {"query": action, "automation": name}
        storage.queue_action(
            kind="recall", payload=json.dumps(payload), source="scheduler"
        )
        storage.append_audit(
            actor="scheduler",
            action="automation.fired",
            target=name,
            note=f"queued recall: {action}",
        )
        return {"status": "queued", "queue": "recall"}

    if kind == "report":
        # Try a Granite-backed daily report; if generation isn't wired (e.g.
        # in tests or offline) we still audit the firing so the loop is
        # visible in the dashboard.
        narrative = ""
        try:
            from cortex_api import generate

            res = generate.daily_narrative(days=1)
            narrative = res.get("narrative", "") if isinstance(res, dict) else ""
        except Exception as e:
            log.info("daily_narrative unavailable: %s", e)
        storage.queue_action(
            kind="free",
            payload=json.dumps({"automation": name, "narrative": narrative[:500]}),
            source="scheduler",
        )
        storage.append_audit(
            actor="scheduler",
            action="automation.fired",
            target=name,
            note="report generated" if narrative else "report stub",
        )
        return {"status": "reported", "bytes": len(narrative)}

    return {"status": "noop"}


def tick(now_ms: int | None = None) -> list[dict]:
    """Run one scheduling pass synchronously. Returns list of fired entries.

    Exposed (rather than buried in the loop) so tests can drive the scheduler
    deterministically without spinning up the asyncio task.
    """

    from cortex_api.storage import now_ms as _now_ms

    now = now_ms if now_ms is not None else _now_ms()
    fired: list[dict] = []
    for auto in storage.list_scheduled_automations():
        if not _is_due(auto, now):
            continue
        try:
            result = _dispatch(auto)
        except Exception as e:
            log.exception("automation %s failed: %s", auto.get("id"), e)
            result = {"status": "error", "error": str(e)}
        storage.mark_automation_run(int(auto["id"]), ts=now)
        fired.append({"id": auto["id"], "name": auto.get("name"), **result})
    return fired


async def run_loop(stop_event: asyncio.Event) -> None:
    """Background task — runs ``tick()`` every ``TICK_SECONDS`` until stopped."""

    log.info("scheduler started (tick=%ds)", TICK_SECONDS)
    while not stop_event.is_set():
        try:
            results = await asyncio.to_thread(tick)
            if results:
                log.info("scheduler fired %d job(s): %s", len(results), results)
        except Exception as e:
            log.exception("scheduler tick failed: %s", e)
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=TICK_SECONDS)
        except asyncio.TimeoutError:
            pass
    log.info("scheduler stopped")
