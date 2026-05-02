# Cortex tests

pytest suite for the backend. Frontend tests are in `src/cortex-web/` (vitest).

## Run

```bash
# from repo root
pip install -r src/cortex-api/requirements.txt
pip install -r src/cortex-bot/requirements.txt
pip install pytest httpx

pytest -v
```

## Coverage

| File | What it covers |
|---|---|
| `test_secrets.py` | `cortex_api.secrets.detect_secrets` — every pattern + redaction + dedupe + entropy fallback |
| `test_storage.py` | DB CRUD: insert, get, list_recent, link_code; feedback math + clamping; tags round-trip; L2→cosine helper |
| `test_retrieval.py` | Re-ranking: λ=0.005 constant, formula, top-k slicing, score-promotes-over-similarity |
| `test_tools.py` | MCP tool dispatch: save → recall round trip, secret refusal, all 5 tools, unknown-tool error |
| `test_api.py` | FastAPI integration via TestClient: auth, all endpoints, 404s, 422 on secret |
| `test_bot_secret_guard.py` | Bot's lightweight client-side secret guard |

## Test isolation

`conftest.py::_isolated_env` (autouse) gives each test:
- A temp `DIARY_DB_PATH` (sqlite file in `tmp_path`)
- Token `DIARY_TOKEN=test-token`
- `EMBEDDINGS_PROVIDER=local` (so we never hit watsonx in tests)
- A reset of `cortex_api.*` modules so settings reload from env

`fake_embed` (opt-in) replaces the embeddings provider with a deterministic
384-dim hash-derived vector — no sentence-transformers download in CI.

## Notes

- `sqlite-vec` is loaded on a best-effort basis. If the extension isn't
  available in the test environment, storage falls back to a plain
  scan-and-return path; tests still pass.
- These tests are intended to be Bob-generated in Phase 3 of the hackathon
  plan. Claude wrote them on 2026-05-01 as part of the "deployment-ready"
  one-shot — attribute to claude-code in BOB_USAGE.md.
