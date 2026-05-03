"""Tests for cortex_api.codebase indexer."""

from __future__ import annotations

from pathlib import Path

import pytest


@pytest.fixture
def sample_repo(tmp_path: Path) -> Path:
    """A tiny fake repo with one Python, one TS, one ignored binary, one nested."""

    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "main.py").write_text(
        "def hello():\n    return 'world'\n\nclass Greeter:\n    pass\n",
    )
    (tmp_path / "src" / "client.ts").write_text(
        "export const x = 1;\nexport function f() { return x; }\n",
    )
    # Should be ignored
    (tmp_path / ".git").mkdir()
    (tmp_path / ".git" / "HEAD").write_text("not code")
    (tmp_path / "node_modules").mkdir()
    (tmp_path / "node_modules" / "ignored.js").write_text("module.exports = 1")
    # Nested matching file
    (tmp_path / "src" / "nested").mkdir()
    (tmp_path / "src" / "nested" / "deep.py").write_text("a = 1\nb = 2\nc = 3\n")
    return tmp_path


def test_indexer_walks_extensions_only(sample_repo, fake_embed):
    from cortex_api import codebase

    result = codebase.index_path(sample_repo)
    assert result["indexed"] == 3  # main.py, client.ts, deep.py
    assert ".py" in result["by_extension"]
    assert ".ts" in result["by_extension"]
    assert result["by_extension"][".py"] == 2
    assert "src/main.py" in result["files"]
    assert "src/nested/deep.py" in result["files"]


def test_indexer_skips_ignored_dirs(sample_repo, fake_embed):
    from cortex_api import codebase

    result = codebase.index_path(sample_repo)
    files = result["files"]
    assert not any("node_modules" in f for f in files)
    assert not any(".git" in f for f in files)


def test_indexer_skip_existing_is_idempotent(sample_repo, fake_embed):
    from cortex_api import codebase

    first = codebase.index_path(sample_repo)
    second = codebase.index_path(sample_repo)
    assert first["indexed"] == 3
    assert second["indexed"] == 0
    assert second["skipped_existing"] == 3


def test_indexer_max_files(sample_repo, fake_embed):
    from cortex_api import codebase

    result = codebase.index_path(sample_repo, max_files=1)
    assert result["indexed"] == 1


def test_indexer_404_on_missing_path(fake_embed):
    from cortex_api import codebase

    with pytest.raises(FileNotFoundError):
        codebase.index_path("/definitely/does/not/exist/anywhere")


def test_list_indexed_files_aggregates_chunks(sample_repo, fake_embed):
    from cortex_api import codebase

    codebase.index_path(sample_repo)
    files = codebase.list_indexed_files(sample_repo)
    paths = {f["path"] for f in files}
    assert "src/main.py" in paths
    assert "src/client.ts" in paths


def test_get_indexed_file_reassembles_chunks(sample_repo, fake_embed):
    from cortex_api import codebase

    codebase.index_path(sample_repo)
    file_data = codebase.get_indexed_file(sample_repo, "src/main.py")
    assert file_data is not None
    assert "def hello" in file_data["body"]
    assert "class Greeter" in file_data["body"]


def test_get_indexed_file_returns_none_when_absent(sample_repo, fake_embed):
    from cortex_api import codebase

    codebase.index_path(sample_repo)
    assert codebase.get_indexed_file(sample_repo, "does_not_exist.py") is None


# ---------- API integration -----------------------------------------------


def test_index_endpoint_404_on_missing_path(client):
    from tests.conftest import auth_headers

    res = client.post(
        "/api/v1/codebase/index",
        json={"path": "/no/such/dir"},
        headers=auth_headers(),
    )
    assert res.status_code == 404


def test_index_then_list_files(client, tmp_path: Path):
    from tests.conftest import auth_headers

    (tmp_path / "a.py").write_text("x = 1\n")
    (tmp_path / "b.ts").write_text("export const y = 2;\n")

    res = client.post(
        "/api/v1/codebase/index",
        json={"path": str(tmp_path), "max_files": 10},
        headers=auth_headers(),
    )
    assert res.status_code == 200
    summary = res.json()
    assert summary["indexed"] == 2

    listing = client.get("/api/v1/codebase/files", headers=auth_headers()).json()
    paths = {f["path"] for f in listing["files"]}
    assert "a.py" in paths
    assert "b.ts" in paths


def test_analyze_code_503_when_llm_off(client):
    from tests.conftest import auth_headers

    res = client.post(
        "/api/v1/analyze/code",
        json={"file": "x.py", "question": "what does this do?"},
        headers=auth_headers(),
    )
    assert res.status_code == 503


def test_suggest_next_503_when_llm_off(client):
    from tests.conftest import auth_headers

    res = client.get("/api/v1/suggest/next", headers=auth_headers())
    assert res.status_code == 503
