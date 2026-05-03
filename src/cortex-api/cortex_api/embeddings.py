"""Embeddings provider abstraction.

watsonx.ai is the primary provider for the IBM ecosystem story; sentence-
transformers is the offline fallback used in tests and when watsonx
credentials are not configured.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from functools import lru_cache

from cortex_api.config import settings

log = logging.getLogger(__name__)


class EmbeddingsProvider(ABC):
    dim: int
    name: str

    @abstractmethod
    def embed(self, text: str) -> list[float]:
        """Return a single normalised embedding vector for ``text``."""


class LocalEmbeddings(EmbeddingsProvider):
    """sentence-transformers/all-MiniLM-L6-v2 — 384 dims, normalised."""

    dim = 384
    name = "local:all-MiniLM-L6-v2"

    def __init__(self) -> None:
        from sentence_transformers import SentenceTransformer

        log.info("Loading local sentence-transformers model")
        self._model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    def embed(self, text: str) -> list[float]:
        vec = self._model.encode(text, normalize_embeddings=True, show_progress_bar=False)
        return [float(x) for x in vec.tolist()]


class WatsonxEmbeddings(EmbeddingsProvider):
    """IBM watsonx.ai embeddings — primary provider for the demo.

    Slate 30m model is 384 dims and matches the local fallback so the
    ``vec_entries`` virtual table dim does not have to change when switching.
    If a different watsonx model is configured the dim must match —
    ``init_db`` reads ``get_provider().dim`` so just keep them aligned.
    """

    dim = 384
    name = "watsonx"

    def __init__(self) -> None:
        if not settings.watsonx_api_key or not settings.watsonx_project_id:
            raise RuntimeError(
                "watsonx credentials missing — set WATSONX_API_KEY and "
                "WATSONX_PROJECT_ID, or set EMBEDDINGS_PROVIDER=local"
            )
        from ibm_watsonx_ai import Credentials  # type: ignore[import-not-found]
        from ibm_watsonx_ai.foundation_models import Embeddings  # type: ignore[import-not-found]

        log.info("Initialising watsonx.ai embeddings (model=%s)", settings.watsonx_embed_model)
        creds = Credentials(api_key=settings.watsonx_api_key, url=settings.watsonx_url)
        self._client = Embeddings(
            model_id=settings.watsonx_embed_model,
            credentials=creds,
            project_id=settings.watsonx_project_id,
        )
        self.name = f"watsonx:{settings.watsonx_embed_model}"

    def embed(self, text: str) -> list[float]:
        result = self._client.embed_documents(texts=[text])
        # watsonx-ai returns either a list of vectors or a dict with "results"
        if isinstance(result, dict):
            embedding = result["results"][0]["embedding"]
        else:
            embedding = result[0]
        return [float(x) for x in embedding]


class FakeEmbeddings(EmbeddingsProvider):
    """Deterministic hash-bucket embeddings — for demos & cold starts.

    Real demos don't need vector quality; they need the lifespan to come
    up *now* without spending 90 s loading sentence-transformers. Token
    hashes get bucketed into a 384-dim float vector so search still
    returns *something*. Set ``EMBEDDINGS_PROVIDER=fake`` to enable.
    """

    dim = 384
    name = "fake:hash-bucket"

    def embed(self, text: str) -> list[float]:
        import hashlib

        vec = [0.0] * self.dim
        # Token-level hashing: each token maps to one bucket; counts → magnitude.
        for tok in (text or "").lower().split():
            h = int(hashlib.blake2b(tok.encode("utf-8"), digest_size=4).hexdigest(), 16)
            vec[h % self.dim] += 1.0
        # L2-normalise so cosine vs sqlite-vec stays comparable.
        norm = sum(x * x for x in vec) ** 0.5
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec


@lru_cache(maxsize=1)
def get_provider() -> EmbeddingsProvider:
    if settings.embeddings_provider == "fake":
        return FakeEmbeddings()
    if settings.embeddings_provider == "watsonx":
        try:
            return WatsonxEmbeddings()
        except Exception as exc:  # noqa: BLE001 — fall back gracefully
            log.warning("watsonx provider unavailable (%s); falling back to local", exc)
    return LocalEmbeddings()
