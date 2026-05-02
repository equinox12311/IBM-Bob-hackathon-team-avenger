"""Shared pytest fixtures.

The cortex-api package needs:
  - sys.path entry so ``import cortex_api`` works
  - a temporary DIARY_DB_PATH so tests don't trample a real database
  - a stubbed embeddings provider so we don't load sentence-transformers
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src" / "cortex-api"))
sys.path.insert(0, str(ROOT / "src" / "cortex-bot"))


@pytest.fixture(autouse=True)
def _isolated_env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Per-test isolated database + deterministic auth token."""

    db_path = tmp_path / "diary.db"
    monkeypatch.setenv("DIARY_DB_PATH", str(db_path))
    monkeypatch.setenv("DIARY_TOKEN", "test-token")
    monkeypatch.setenv("EMBEDDINGS_PROVIDER", "local")

    # cortex_api.config.settings is a module-level singleton — re-import
    # so each test gets a fresh Settings() with the overridden env.
    for mod in [
        "cortex_api.config",
        "cortex_api.storage",
        "cortex_api.embeddings",
        "cortex_api.retrieval",
        "cortex_api.server",
        "cortex_api.tools",
    ]:
        sys.modules.pop(mod, None)


@pytest.fixture
def fake_embed(monkeypatch: pytest.MonkeyPatch):
    """Replace the embeddings provider with a deterministic 384-dim vector."""

    class FakeProvider:
        dim = 384
        name = "fake"

        def embed(self, text: str) -> list[float]:
            # Deterministic per-text vector: hash → 384 floats in [-1, 1].
            seed = sum(ord(c) for c in text)
            return [
                ((seed * (i + 1)) % 1000) / 500.0 - 1.0  # roughly in [-1, 1]
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
