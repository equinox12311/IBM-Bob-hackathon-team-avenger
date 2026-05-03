"""Cron-style scheduler tests — drive the loop synchronously via tick()."""

from __future__ import annotations

import json
from datetime import datetime, timezone

import pytest

from tests.conftest import auth_headers


# ---------- isolated unit tests against scheduler.tick() -------------------


def _ms(year: int, month: int, day: int, hour: int = 0, minute: int = 0) -> int:
    return int(
        datetime(year, month, day, hour, minute, tzinfo=timezone.utc).timestamp() * 1000
    )


def test_create_automation_with_schedule_returns_id(client):
    r = client.post(
        "/api/v1/automations",
        json={
            "name": "morning recall",
            "trigger_kind": "recall",
            "action": "what did I work on yesterday",
            "schedule": "0 9 * * *",
        },
        headers=auth_headers(),
    )
    assert r.status_code == 201
    body = r.json()
    assert body["id"] > 0


def test_create_automation_rejects_invalid_cron(client):
    pytest.importorskip("croniter")
    r = client.post(
        "/api/v1/automations",
        json={
            "name": "broken",
            "trigger_kind": "notify",
            "action": "x",
            "schedule": "this is not cron",
        },
        headers=auth_headers(),
    )
    assert r.status_code == 400


def test_create_automation_without_schedule_still_works(client):
    """Legacy event-driven automations (no schedule) must still be creatable."""
    r = client.post(
        "/api/v1/automations",
        json={"name": "legacy", "trigger_kind": "task", "action": "noop"},
        headers=auth_headers(),
    )
    assert r.status_code == 201


def test_list_includes_schedule_columns(client):
    client.post(
        "/api/v1/automations",
        json={
            "name": "n",
            "trigger_kind": "notify",
            "action": "ping",
            "schedule": "*/5 * * * *",
        },
        headers=auth_headers(),
    )
    r = client.get("/api/v1/automations", headers=auth_headers())
    assert r.status_code == 200
    rows = r.json()["automations"]
    assert rows
    a = rows[0]
    assert a["schedule"] == "*/5 * * * *"
    assert a["last_run_at"] is None
    assert a["run_count"] == 0


def test_tick_fires_due_automation_and_writes_audit(client):
    pytest.importorskip("croniter")
    from cortex_api import scheduler, storage

    auto_id = storage.create_automation(
        name="every minute",
        trigger_kind="notify",
        action="hi",
        schedule="* * * * *",
    )
    # Anchor "now" 5 minutes after creation so the schedule has fired.
    auto = storage.get_automation(auto_id)
    assert auto is not None
    future_ms = (auto["created_at"] or storage.now_ms()) + 5 * 60_000

    fired = scheduler.tick(now_ms=future_ms)

    assert any(f["id"] == auto_id and f["status"] == "notified" for f in fired)
    after = storage.get_automation(auto_id)
    assert after is not None
    assert after["last_run_at"] == future_ms
    assert after["run_count"] == 1

    # Audit row was appended
    audit = storage.list_audit(limit=10)
    assert any(
        e["action"] == "automation.fired" and e["target"] == "every minute"
        for e in audit
    )


def test_tick_skips_disabled(client):
    pytest.importorskip("croniter")
    from cortex_api import scheduler, storage

    auto_id = storage.create_automation(
        name="paused", trigger_kind="notify", action="x", schedule="* * * * *"
    )
    storage.toggle_automation(auto_id, False)
    auto = storage.get_automation(auto_id)
    fired = scheduler.tick(now_ms=(auto["created_at"] or 0) + 10 * 60_000)
    assert all(f["id"] != auto_id for f in fired)


def test_tick_skips_when_not_due_yet(client):
    pytest.importorskip("croniter")
    from cortex_api import scheduler, storage

    # Daily at 09:00; anchor now to 08:00 of the same day -> not due yet.
    auto_id = storage.create_automation(
        name="daily 9am",
        trigger_kind="notify",
        action="x",
        schedule="0 9 * * *",
    )
    # Force last_run_at to a recent time so cron's "next" is tomorrow 09:00
    storage.mark_automation_run(auto_id, ts=_ms(2026, 5, 1, 9, 0))
    fired = scheduler.tick(now_ms=_ms(2026, 5, 1, 23, 59))
    assert all(f["id"] != auto_id for f in fired)


def test_recall_automation_queues_pending_action(client):
    pytest.importorskip("croniter")
    from cortex_api import scheduler, storage

    auto_id = storage.create_automation(
        name="ask bob nightly",
        trigger_kind="recall",
        action="summarize today",
        schedule="* * * * *",
    )
    auto = storage.get_automation(auto_id)
    fired = scheduler.tick(now_ms=(auto["created_at"] or 0) + 5 * 60_000)
    assert any(f["status"] == "queued" for f in fired)

    pending = storage.list_pending_actions(consume=False, limit=10)
    assert any(
        p["kind"] == "recall"
        and json.loads(p["payload"]).get("query") == "summarize today"
        for p in pending
    )


def test_run_now_endpoint(client):
    """The mobile 'Run now' button bypasses the cron schedule."""
    create = client.post(
        "/api/v1/automations",
        json={
            "name": "manual test",
            "trigger_kind": "notify",
            "action": "ping",
            "schedule": "0 9 * * *",
        },
        headers=auth_headers(),
    ).json()
    r = client.post(
        f"/api/v1/automations/{create['id']}/run", headers=auth_headers()
    )
    assert r.status_code == 200
    assert r.json()["status"] == "notified"


def test_run_now_404_on_missing(client):
    r = client.post("/api/v1/automations/9999/run", headers=auth_headers())
    assert r.status_code == 404


def test_scheduler_tick_endpoint(client):
    pytest.importorskip("croniter")
    create = client.post(
        "/api/v1/automations",
        json={
            "name": "tick test",
            "trigger_kind": "notify",
            "action": "x",
            "schedule": "* * * * *",
        },
        headers=auth_headers(),
    ).json()
    # Push created_at + last_run_at far enough into the past that "* * * * *"
    # has fired several times since then.
    from cortex_api import storage
    past = storage.now_ms() - 10 * 60_000
    with storage._connect() as conn:
        conn.execute(
            "UPDATE automations SET created_at = ?, last_run_at = ?, run_count = 0 "
            "WHERE id = ?",
            (past, past, create["id"]),
        )

    r = client.post("/api/v1/scheduler/tick", headers=auth_headers())
    assert r.status_code == 200
    body = r.json()
    assert body["count"] >= 1
