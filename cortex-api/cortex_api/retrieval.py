"""Search + re-ranking on top of storage.

Phase 2 (M2): port the formula from docs/CONTRACTS.md::
    final_score = entry.score
                * exp(-λ * days_since_created)
                * cosine_similarity(q_embedding, entry_embedding)
"""

from cortex_api import storage
from cortex_api.embeddings import get_provider
from cortex_api.models import Entry


def recall(query: str, k: int = 5) -> list[Entry]:
    """Top-k entries for ``query``."""

    provider = get_provider()
    q_vec = provider.embed(query)
    return storage.search(q_vec, k=k)
