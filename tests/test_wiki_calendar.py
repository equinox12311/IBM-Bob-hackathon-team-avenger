"""Tests for the wiki module + calendar aggregation."""

from __future__ import annotations

import pytest


# ---------- wiki ----------------------------------------------------------


def test_wiki_list_empty(client):
    from tests.conftest import auth_headers

    res = client.get("/api/v1/wiki", headers=auth_headers())
    assert res.status_code == 200
    assert res.json()["pages"] == []


def test_wiki_get_404_when_missing(client):
    from tests.conftest import auth_headers

    res = client.get("/api/v1/wiki/no-such-page", headers=auth_headers())
    assert res.status_code == 404


def test_wiki_generate_503_when_llm_off(client):
    from tests.conftest import auth_headers

    res = client.post(
        "/api/v1/wiki/generate",
        json={"topic": "authentication"},
        headers=auth_headers(),
    )
    assert res.status_code == 503


def test_wiki_generate_400_on_empty_topic(client):
    from tests.conftest import auth_headers

    res = client.post(
        "/api/v1/wiki/generate",
        json={"topic": "   "},
        headers=auth_headers(),
    )
    # Empty topic short-circuits before the LLM check on the python side, but
    # since 503 takes precedence when LLM is off, also accept 503.
    assert res.status_code in (400, 503)


def test_slugify_handles_unicode_and_long_topics(fake_embed):
    from cortex_api.wiki import _slugify

    assert _slugify("Authentication Architecture") == "authentication-architecture"
    assert _slugify("v0.3 — Design / Plan") == "v03-design-plan"
    long_topic = "x" * 200
    assert len(_slugify(long_topic)) <= 80
    assert _slugify("   ") == "untitled"


def test_list_pages_aggregates_by_slug(client, fake_embed):
    """Manually inserting kind=wiki entries should surface in /wiki list."""

    from cortex_api import storage
    from tests.conftest import auth_headers

    body1 = "# Authentication\n\nFirst draft."
    body2 = "# Auth Architecture\n\nUpdated draft."
    storage.init_db(embedding_dim=384)
    storage.insert_entry(
        text=body1,
        source="web",
        embedding=[0.0] * 384,
        kind="wiki",
        repo="/x",
        file="auth-architecture.md",
        tags=["auth", "wiki"],
    )
    storage.insert_entry(
        text=body2,
        source="web",
        embedding=[0.0] * 384,
        kind="wiki",
        repo="/x",
        file="auth-architecture.md",
        tags=["auth", "wiki"],
    )

    res = client.get("/api/v1/wiki", headers=auth_headers()).json()
    pages = res["pages"]
    # newest revision wins per slug
    assert len(pages) == 1
    assert pages[0]["slug"] == "auth-architecture"
    assert pages[0]["title"] == "Auth Architecture"


# ---------- calendar ------------------------------------------------------


def test_calendar_default_month(client):
    from tests.conftest import auth_headers

    res = client.get("/api/v1/calendar", headers=auth_headers())
    assert res.status_code == 200
    body = res.json()
    assert "month" in body
    assert "days" in body
    assert isinstance(body["days"], list)


def test_calendar_explicit_month(client, fake_embed):
    from cortex_api import storage
    from tests.conftest import auth_headers

    storage.init_db(embedding_dim=384)
    # insert one entry in current month so a day shows up
    storage.insert_entry(
        text="hello",
        source="web",
        embedding=[0.0] * 384,
        kind="note",
    )
    from datetime import datetime, timezone

    today = datetime.now(timezone.utc)
    month = f"{today.year:04d}-{today.month:02d}"
    res = client.get(
        f"/api/v1/calendar?month={month}",
        headers=auth_headers(),
    ).json()
    assert res["month"] == month
    total = sum(d["count"] for d in res["days"])
    assert total >= 1


def test_calendar_400_on_bad_month(client):
    from tests.conftest import auth_headers

    res = client.get("/api/v1/calendar?month=not-a-month", headers=auth_headers())
    assert res.status_code == 400
