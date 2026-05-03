"""Shared pytest fixtures.

The cortex-api package needs:
  - sys.path entry so ``import cortex_api`` works
  - a temporary DIARY_DB_PATH so tests don't trample a real database
  - a stubbed embeddings provider so we don't load sentence-transformers
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src" / "cortex-api"))
sys.path.insert(0, str(ROOT / "src" / "cortex-bot"))


@pytest.fixture(autouse=True)
def _isolated_env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Per-test isolated database, deterministic auth token, local embeddings.

    We patch ``settings`` *in place* so any module that has already imported
    ``from cortex_api.config import settings`` sees the new values immediately.
    """

    db_path = tmp_path / "diary.db"
    monkeypatch.setenv("DIARY_DB_PATH", str(db_path))
    monkeypatch.setenv("DIARY_TOKEN", "test-token")
    monkeypatch.setenv("EMBEDDINGS_PROVIDER", "local")
    # Force LLM off in tests — otherwise the local Granite GGUF, when
    # present on disk, would silently turn the "503 when llm off" tests
    # into 200s. Tests that want LLM on can set settings.llm_provider
    # in their own scope.
    monkeypatch.setenv("LLM_PROVIDER", "off")

    from cortex_api.config import settings

    monkeypatch.setattr(settings, "diary_db_path", db_path)
    monkeypatch.setattr(settings, "diary_token", "test-token")
    monkeypatch.setattr(settings, "embeddings_provider", "local")
    monkeypatch.setattr(settings, "llm_provider", "off")

    # Reset the embeddings provider singleton so the fake_embed fixture (or a
    # fresh local model) is picked up next time get_provider() is called.
    from cortex_api.embeddings import get_provider

    get_provider.cache_clear()


@pytest.fixture
def fake_embed(monkeypatch: pytest.MonkeyPatch):
    """Replace the embeddings provider with a deterministic 384-dim vector."""

    class FakeProvider:
        dim = 384
        name = "fake"

        def embed(self, text: str) -> list[float]:
            seed = sum(ord(c) for c in text)
            return [
                ((seed * (i + 1)) % 1000) / 500.0 - 1.0
                for i in range(self.dim)
            ]

    from cortex_api import embeddings as emb

    fake = FakeProvider()
    monkeypatch.setattr(emb, "get_provider", lambda: fake)
    return fake


@pytest.fixture
def client(fake_embed):
    """FastAPI TestClient with an isolated DB and fake embeddings."""

    from fastapi.testclient import TestClient

    from cortex_api.server import app

    with TestClient(app) as c:
        yield c


def auth_headers(token: str = "test-token") -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
