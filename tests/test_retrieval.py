"""Tests for cortex_api.retrieval re-ranking math."""

from __future__ import annotations

import math

import pytest


def test_recency_lambda_is_per_day():
    from cortex_api.retrieval import RECENCY_LAMBDA

    # Rule from CONTRACTS.md: λ = 0.005 / day
    assert RECENCY_LAMBDA == pytest.approx(0.005)


def test_final_score_formula(monkeypatch):
    from cortex_api import retrieval, storage
    from cortex_api.models import Entry

    # Pretend the entry is exactly 10 days old
    fake_now = 1_000_000_000_000
    ten_days_ago = fake_now - 10 * 86_400_000
    monkeypatch.setattr(storage, "now_ms", lambda: fake_now)

    entry = Entry(
        id=1, text="x", score=2.0, source="bob",
        created_at=ten_days_ago,
    )
    cosine = 0.8
    expected = 2.0 * math.exp(-0.005 * 10) * 0.8

    actual = retrieval._final_score(entry, cosine)
    assert actual == pytest.approx(expected, rel=1e-9)


def test_recall_returns_top_k(monkeypatch, fake_embed):
    """recall() should over-fetch, re-rank, and trim to k."""

    from cortex_api import retrieval, storage
    from cortex_api.models import Entry

    storage.init_db(embedding_dim=384)

    # Stub storage.search to return 3 candidates with declining cosine similarity
    fake_entries = [
        (Entry(id=1, text="a", score=1.0, source="bob", created_at=storage.now_ms()), 0.9),
        (Entry(id=2, text="b", score=1.0, source="bob", created_at=storage.now_ms()), 0.7),
        (Entry(id=3, text="c", score=1.0, source="bob", created_at=storage.now_ms()), 0.5),
    ]
    monkeypatch.setattr(storage, "search", lambda q, k=5: fake_entries)

    out = retrieval.recall("anything", k=2)
    assert len(out) == 2
    # Highest cosine first (recency identical, score identical)
    assert out[0].id == 1
    assert out[1].id == 2


def test_recall_promotes_high_entry_score(monkeypatch, fake_embed):
    """An entry with a higher score should beat a slightly more-similar but lower-scored entry."""

    from cortex_api import retrieval, storage
    from cortex_api.models import Entry

    now = storage.now_ms()
    candidates = [
        # id=1: lower cosine but higher score
        (Entry(id=1, text="a", score=3.0, source="bob", created_at=now), 0.6),
        # id=2: slightly higher cosine but neutral score — should still lose because 3.0 * 0.6 > 1.0 * 0.7
        (Entry(id=2, text="b", score=1.0, source="bob", created_at=now), 0.7),
    ]
    monkeypatch.setattr(storage, "search", lambda q, k=5: candidates)

    out = retrieval.recall("anything", k=2)
    assert out[0].id == 1
