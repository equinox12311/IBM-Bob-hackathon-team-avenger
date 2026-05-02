"""Integration tests for the FastAPI app via httpx TestClient."""

from __future__ import annotations

from tests.conftest import auth_headers


def test_health_no_auth_required(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "version" in body


def test_create_entry_requires_auth(client):
    r = client.post("/api/v1/entries", json={"text": "hi", "source": "web"})
    assert r.status_code == 401


def test_create_entry_rejects_wrong_token(client):
    r = client.post(
        "/api/v1/entries",
        json={"text": "hi", "source": "web"},
        headers={"Authorization": "Bearer wrong-token"},
    )
    assert r.status_code == 401


def test_create_entry_succeeds(client):
    r = client.post(
        "/api/v1/entries",
        json={"text": "first entry", "source": "web"},
        headers=auth_headers(),
    )
    assert r.status_code == 201
    body = r.json()
    assert body["id"] > 0
    assert body["created_at"] > 0


def test_create_entry_refuses_secret(client):
    r = client.post(
        "/api/v1/entries",
        json={"text": "AKIAIOSFODNN7EXAMPLE leaked", "source": "web"},
        headers=auth_headers(),
    )
    assert r.status_code == 422
    detail = r.json()["detail"]
    assert detail["error"] == "secret_detected"
    assert detail["findings"]


def test_timeline_returns_recent_entries(client):
    for i in range(3):
        client.post(
            "/api/v1/entries",
            json={"text": f"entry {i}", "source": "web"},
            headers=auth_headers(),
        )
    r = client.get("/api/v1/entries?limit=10", headers=auth_headers())
    assert r.status_code == 200
    entries = r.json()["entries"]
    assert len(entries) == 3
    assert [e["text"] for e in entries] == ["entry 2", "entry 1", "entry 0"]


def test_search_returns_results(client):
    client.post(
        "/api/v1/entries",
        json={"text": "Postgres connection pool fix", "source": "web"},
        headers=auth_headers(),
    )
    r = client.get(
        "/api/v1/search?q=postgres&k=5",
        headers=auth_headers(),
    )
    assert r.status_code == 200
    assert "entries" in r.json()


def test_get_entry_404_for_unknown_id(client):
    r = client.get("/api/v1/entries/999999", headers=auth_headers())
    assert r.status_code == 404


def test_get_entry_returns_entry(client):
    create = client.post(
        "/api/v1/entries",
        json={"text": "fetch me", "source": "web"},
        headers=auth_headers(),
    ).json()
    r = client.get(f"/api/v1/entries/{create['id']}", headers=auth_headers())
    assert r.status_code == 200
    assert r.json()["text"] == "fetch me"


def test_link_code(client):
    create = client.post(
        "/api/v1/entries",
        json={"text": "link me", "source": "web"},
        headers=auth_headers(),
    ).json()
    r = client.patch(
        f"/api/v1/entries/{create['id']}/link",
        json={
            "repo": "github.com/u/r",
            "file": "src/x.py",
            "line_start": 1,
            "line_end": 5,
        },
        headers=auth_headers(),
    )
    assert r.status_code == 200
    assert r.json() == {"id": create["id"]}

    fetched = client.get(
        f"/api/v1/entries/{create['id']}",
        headers=auth_headers(),
    ).json()
    assert fetched["file"] == "src/x.py"


def test_feedback_changes_score(client):
    create = client.post(
        "/api/v1/entries",
        json={"text": "feedback me", "source": "web"},
        headers=auth_headers(),
    ).json()
    r = client.post(
        f"/api/v1/entries/{create['id']}/feedback",
        json={"signal": "boost"},
        headers=auth_headers(),
    )
    assert r.status_code == 200
    assert r.json()["score"] > 1.0


def test_feedback_404_for_unknown(client):
    r = client.post(
        "/api/v1/entries/999999/feedback",
        json={"signal": "boost"},
        headers=auth_headers(),
    )
    assert r.status_code == 404
