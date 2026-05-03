"""Tests for cortex_api.skills CRUD + audit log."""

from __future__ import annotations

from pathlib import Path

import pytest


# ---------- skills --------------------------------------------------------


@pytest.fixture(autouse=True)
def _isolated_skills_root(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    """Point the skills module at a temp project root by overriding the DB path
    (skills derive root from settings.diary_db_path.parent.parent)."""

    db = tmp_path / "data" / "diary.db"
    db.parent.mkdir(parents=True, exist_ok=True)

    from cortex_api.config import settings

    monkeypatch.setattr(settings, "diary_db_path", db)
    yield


def test_create_then_list_skill(client):
    from tests.conftest import auth_headers

    res = client.post(
        "/api/v1/skills",
        json={
            "slug": "weekly-summary",
            "description": "Help the developer summarise the week's commits, decisions, and learnings.",
            "body": "Pull entries from the last 7 days, group by kind, write a 200-word summary.",
        },
        headers=auth_headers(),
    )
    assert res.status_code == 201, res.text

    listing = client.get("/api/v1/skills", headers=auth_headers()).json()
    slugs = [s["slug"] for s in listing["skills"]]
    assert "weekly-summary" in slugs


def test_create_rejects_short_description(client):
    from tests.conftest import auth_headers

    res = client.post(
        "/api/v1/skills",
        json={"slug": "x", "description": "too short", "body": "irrelevant"},
        headers=auth_headers(),
    )
    assert res.status_code == 400


def test_create_rejects_invalid_slug(client):
    from tests.conftest import auth_headers

    res = client.post(
        "/api/v1/skills",
        json={
            "slug": "Bad Slug!",
            "description": "x" * 50,
            "body": "body",
        },
        headers=auth_headers(),
    )
    assert res.status_code == 400


def test_cannot_overwrite_reserved_skill(client):
    from tests.conftest import auth_headers

    res = client.post(
        "/api/v1/skills",
        json={
            "slug": "cortex",
            "description": "x" * 50,
            "body": "body",
        },
        headers=auth_headers(),
    )
    assert res.status_code == 400


def test_get_404_when_missing(client):
    from tests.conftest import auth_headers

    res = client.get("/api/v1/skills/no-such-skill", headers=auth_headers())
    assert res.status_code == 404


def test_create_then_get_then_delete(client):
    from tests.conftest import auth_headers

    payload = {
        "slug": "unit-test-helper",
        "description": "A long enough description to please the matcher; talks about generating unit tests.",
        "body": "Look at the file, infer test cases, suggest pytest scaffolding.",
    }
    create = client.post("/api/v1/skills", json=payload, headers=auth_headers())
    assert create.status_code == 201

    got = client.get("/api/v1/skills/unit-test-helper", headers=auth_headers()).json()
    assert got["body"].startswith("Look at the file")
    assert got["managed"] is False

    del_res = client.delete(
        "/api/v1/skills/unit-test-helper",
        headers=auth_headers(),
    )
    assert del_res.status_code == 204

    after = client.get(
        "/api/v1/skills/unit-test-helper",
        headers=auth_headers(),
    )
    assert after.status_code == 404


def test_create_409_on_duplicate(client):
    from tests.conftest import auth_headers

    payload = {
        "slug": "duplicate-check",
        "description": "x" * 50,
        "body": "body",
    }
    first = client.post("/api/v1/skills", json=payload, headers=auth_headers())
    assert first.status_code == 201
    second = client.post("/api/v1/skills", json=payload, headers=auth_headers())
    assert second.status_code == 409


def test_update_skill(client):
    from tests.conftest import auth_headers

    payload = {
        "slug": "patchable",
        "description": "x" * 50,
        "body": "v1",
    }
    client.post("/api/v1/skills", json=payload, headers=auth_headers())
    upd = client.patch(
        "/api/v1/skills/patchable",
        json={"body": "v2"},
        headers=auth_headers(),
    )
    assert upd.status_code == 200
    assert upd.json()["body"].strip() == "v2"


# ---------- audit log -----------------------------------------------------


def test_audit_endpoint_starts_empty(client):
    from tests.conftest import auth_headers

    res = client.get("/api/v1/security/audit", headers=auth_headers())
    assert res.status_code == 200
    assert isinstance(res.json()["events"], list)


def test_audit_records_skill_create(client):
    from tests.conftest import auth_headers

    client.post(
        "/api/v1/skills",
        json={
            "slug": "audited",
            "description": "x" * 50,
            "body": "body",
        },
        headers=auth_headers(),
    )
    events = client.get("/api/v1/security/audit", headers=auth_headers()).json()["events"]
    actions = [e["action"] for e in events]
    assert "skill.create" in actions


def test_audit_summary(client):
    from tests.conftest import auth_headers

    # Trigger a couple of audited actions
    client.post(
        "/api/v1/skills",
        json={"slug": "summary-1", "description": "x" * 50, "body": "b"},
        headers=auth_headers(),
    )
    client.delete("/api/v1/skills/summary-1", headers=auth_headers())

    res = client.get(
        "/api/v1/security/summary?window_hours=24",
        headers=auth_headers(),
    ).json()
    assert res["total"] >= 2
    assert "skill.create" in res["by_action"]
    assert "skill.delete" in res["by_action"]
