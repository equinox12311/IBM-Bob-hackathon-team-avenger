"""Unit tests for cortex_api.storage.

These tests exercise the SQLite layer with a temp DB. sqlite-vec may or may
not be available at runtime — the tests cover the fallback path and assert
that core CRUD and feedback semantics work either way.
"""

from __future__ import annotations

import time

import pytest


@pytest.fixture
def storage_module():
    from cortex_api import storage

    storage.init_db(embedding_dim=384)
    return storage


def _insert(storage_module, text="hello world", source="bob", **extra):
    return storage_module.insert_entry(
        text=text,
        source=source,
        embedding=[0.0] * 384,
        **extra,
    )


def test_insert_and_get(storage_module):
    entry_id, created_at = _insert(storage_module, text="my first entry")
    assert entry_id > 0
    assert created_at > 0
    entry = storage_module.get_entry(entry_id)
    assert entry is not None
    assert entry.text == "my first entry"
    assert entry.source == "bob"
    assert entry.score == pytest.approx(1.0)


def test_get_missing_returns_none(storage_module):
    assert storage_module.get_entry(999_999) is None


def test_list_recent_orders_by_created_at_desc(storage_module):
    _insert(storage_module, text="oldest")
    time.sleep(0.01)  # ensure created_at differs
    _insert(storage_module, text="middle")
    time.sleep(0.01)
    _insert(storage_module, text="newest")
    entries = storage_module.list_recent(limit=10)
    assert [e.text for e in entries] == ["newest", "middle", "oldest"]


def test_list_recent_respects_limit(storage_module):
    for i in range(5):
        _insert(storage_module, text=f"entry {i}")
    assert len(storage_module.list_recent(limit=3)) == 3


def test_link_code_updates_metadata(storage_module):
    entry_id, _ = _insert(storage_module)
    storage_module.link_code(
        entry_id, repo="github.com/user/repo", file="src/x.py", line_start=10, line_end=20
    )
    e = storage_module.get_entry(entry_id)
    assert e.repo == "github.com/user/repo"
    assert e.file == "src/x.py"
    assert e.line_start == 10
    assert e.line_end == 20


def test_apply_feedback_boost_increases_score(storage_module):
    entry_id, _ = _insert(storage_module)
    new_score = storage_module.apply_feedback(entry_id, "boost")
    assert new_score == pytest.approx(1.2)
    assert storage_module.get_entry(entry_id).score == pytest.approx(1.2)


def test_apply_feedback_flag_decreases_score(storage_module):
    entry_id, _ = _insert(storage_module)
    new_score = storage_module.apply_feedback(entry_id, "flag")
    assert new_score == pytest.approx(0.7)


def test_score_is_clamped_high(storage_module):
    entry_id, _ = _insert(storage_module)
    for _ in range(40):
        storage_module.apply_feedback(entry_id, "boost")
    final = storage_module.get_entry(entry_id).score
    assert final == pytest.approx(5.0)  # upper clamp


def test_score_is_clamped_low(storage_module):
    entry_id, _ = _insert(storage_module)
    for _ in range(40):
        storage_module.apply_feedback(entry_id, "flag")
    final = storage_module.get_entry(entry_id).score
    assert final == pytest.approx(0.1)  # lower clamp


def test_apply_feedback_missing_entry_raises(storage_module):
    with pytest.raises(LookupError):
        storage_module.apply_feedback(999_999, "boost")


def test_tags_round_trip(storage_module):
    entry_id, _ = _insert(storage_module, tags=["postgres", "perf", "fix"])
    e = storage_module.get_entry(entry_id)
    assert set(e.tags) == {"postgres", "perf", "fix"}


def test_tags_empty_round_trip(storage_module):
    entry_id, _ = _insert(storage_module)
    e = storage_module.get_entry(entry_id)
    assert e.tags == []


def test_l2_to_cosine_for_normalised_vectors(storage_module):
    # For unit vectors, L2 = sqrt(2(1 - cos)). The helper inverts this.
    f = storage_module._l2_to_cosine
    assert f(0.0) == pytest.approx(1.0)              # identical vectors
    assert f(2.0 ** 0.5) == pytest.approx(0.0, abs=1e-9)  # orthogonal
    assert f(2.0) == pytest.approx(-1.0)             # opposite
