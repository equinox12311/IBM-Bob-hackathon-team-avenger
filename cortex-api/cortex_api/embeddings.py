"""Embeddings provider abstraction.

Phase 2 (M4): wire watsonx.ai as the primary provider; keep
sentence-transformers as the local fallback. The abstract interface here lets
the rest of the code stay agnostic.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from functools import lru_cache

from cortex_api.config import settings


class EmbeddingsProvider(ABC):
    dim: int

    @abstractmethod
    def embed(self, text: str) -> list[float]:
        """Return a single embedding vector for ``text``."""


class LocalEmbeddings(EmbeddingsProvider):
    """sentence-transformers MiniLM-L6-v2 — 384 dims."""

    dim = 384

    def __init__(self) -> None:
        from sentence_transformers import SentenceTransformer

        self._model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    def embed(self, text: str) -> list[float]:
        vec = self._model.encode(text, normalize_embeddings=True)
        return vec.tolist()


class WatsonxEmbeddings(EmbeddingsProvider):
    """IBM watsonx.ai embeddings.

    TODO(M4 Phase 2): finalise dim once we pick the watsonx model.
    Slate 30m → 384 dim. If a different model is selected, update both ``dim``
    and the ``vec_entries`` virtual table accordingly.
    """

    dim = 384

    def __init__(self) -> None:
        # TODO(M4): import + initialise ibm-watsonx-ai client with
        # settings.watsonx_api_key / project_id / url / embed_model.
        raise NotImplementedError("Wire up watsonx.ai in Phase 2")

    def embed(self, text: str) -> list[float]:  # pragma: no cover
        raise NotImplementedError


@lru_cache(maxsize=1)
def get_provider() -> EmbeddingsProvider:
    if settings.embeddings_provider == "watsonx":
        return WatsonxEmbeddings()
    return LocalEmbeddings()
