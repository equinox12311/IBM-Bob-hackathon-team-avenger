# cortex-api

Cortex MCP server + REST API. Owned by **M2** (Backend Lead).

- Listens on **port 8080** (matches submission spec)
- Storage: SQLite + sqlite-vec at `data/diary.db`
- Embeddings: watsonx.ai (default) or local sentence-transformers fallback
- Two transports: HTTP/SSE (this file) and MCP/stdio (`cortex_api/mcp_server.py`)

## Run locally (without Docker)

```bash
cd src/cortex-api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../../.env.example ../../.env # then fill in DIARY_TOKEN at minimum
python -m cortex_api
```

Then hit `http://localhost:8080/health`.

## Run via Docker

From the repo root:

```bash
docker compose up api
```

## Endpoints (matches `docs/CONTRACTS.md`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness |
| POST | `/api/v1/entries` | save a new entry |
| GET | `/api/v1/search?q=…&k=5` | semantic recall |
| GET | `/api/v1/entries?limit=20` | timeline |
| PATCH | `/api/v1/entries/{id}/link` | attach file:line |
| POST | `/api/v1/entries/{id}/feedback` | boost or flag |

All non-health endpoints require `Authorization: Bearer ${DIARY_TOKEN}`.

## Phase 1 work (M2)

1. Real `POST /entries` → persists to SQLite + embeds (`storage.insert_entry`)
2. Real `GET /search` → vector search via sqlite-vec (`storage.search` + `retrieval.recall`)
3. Add MCP stdio transport (`mcp_server.py`) wrapping the same handlers

## Phase 2/3 work (M2 + M4)

- Implement `diary_link_code`, `diary_feedback`, `diary_timeline` properly
- Wire watsonx.ai as the embeddings provider
- Re-ranking math (see `retrieval.py` docstring)
- pytest suite (Bob-generated)
- Security/secret scan (Bob)
