"""Tests for cortex_api.tools.call_tool dispatch."""

from __future__ import annotations

import json

import pytest


@pytest.fixture
def tools(fake_embed):
    from cortex_api import storage, tools as tools_mod

    storage.init_db(embedding_dim=384)
    return tools_mod


def test_diary_save_and_recall_round_trip(tools):
    save_resp = json.loads(tools.call_tool("diary_save", {"text": "postgres pool fix"}))
    assert "id" in save_resp

    recall_resp = json.loads(tools.call_tool("diary_recall", {"query": "postgres"}))
    assert "entries" in recall_resp
    ids = [e["id"] for e in recall_resp["entries"]]
    assert save_resp["id"] in ids


def test_diary_save_refuses_secret(tools):
    resp = json.loads(
        tools.call_tool("diary_save", {"text": "key is AKIAIOSFODNN7EXAMPLE"})
    )
    assert resp.get("error") == "secret_detected"
    assert resp.get("findings")


def test_diary_timeline_returns_recent(tools):
    for n in range(3):
        tools.call_tool("diary_save", {"text": f"entry {n}"})
    resp = json.loads(tools.call_tool("diary_timeline", {"limit": 10}))
    assert len(resp["entries"]) == 3


def test_diary_link_code(tools):
    save = json.loads(tools.call_tool("diary_save", {"text": "linked entry"}))
    resp = json.loads(
        tools.call_tool(
            "diary_link_code",
            {
                "entry_id": save["id"],
                "repo": "github.com/x/y",
                "file": "a.py",
                "line_start": 1,
                "line_end": 2,
            },
        )
    )
    assert resp["id"] == save["id"]


def test_diary_feedback_boost(tools):
    save = json.loads(tools.call_tool("diary_save", {"text": "feedback target"}))
    resp = json.loads(
        tools.call_tool("diary_feedback", {"entry_id": save["id"], "signal": "boost"})
    )
    assert resp["score"] == pytest.approx(1.2)


def test_unknown_tool_returns_error(tools):
    resp = json.loads(tools.call_tool("not_a_tool", {}))
    assert "error" in resp


def test_tool_definitions_match_contracts(tools):
    names = [t["name"] for t in tools.TOOL_DEFINITIONS]
    assert set(names) == {
        "diary_save",
        "diary_recall",
        "diary_link_code",
        "diary_feedback",
        "diary_timeline",
    }
