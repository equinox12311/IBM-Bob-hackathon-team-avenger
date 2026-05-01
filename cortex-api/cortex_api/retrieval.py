"""Search + re-ranking on top of storage.

Re-ranking formula (frozen in docs/CONTRACTS.md):

    final_score = entry.score
                * exp(-λ · days_since_created)            (λ = 0.005 / day)
                * cosine_similarity(q_embedding, entry_embedding)

The cosine similarity comes from :func:`storage.search` (which decodes
sqlite-vec's L2 distance for unit-normalised vectors).
"""

from __future__ import annotations

import math

from cortex_api import storage
from cortex_api.embeddings import get_provider
from cortex_api.models import Entry

RECENCY_LAMBDA = 0.005  # per day


def recall(query: str, k: int = 5) -> list[Entry]:
    """Top-k entries for ``query`` after re-ranking."""

    provider = get_provider()
    q_vec = provider.embed(query)

    # Over-fetch a bit so re-ranking can re-order beyond the raw KNN order.
    candidates = storage.search(q_vec, k=max(k * 3, k))

    ranked = sorted(
        (
            (_final_score(entry, cosine), entry)
            for entry, cosine in candidates
        ),
        key=lambda pair: pair[0],
        reverse=True,
    )
    return [entry for _, entry in ranked[:k]]


def _final_score(entry: Entry, cosine: float) -> float:
    days = storage.days_since(entry.created_at)
    return entry.score * math.exp(-RECENCY_LAMBDA * days) * cosine
