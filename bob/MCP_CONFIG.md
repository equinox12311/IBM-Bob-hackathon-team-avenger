# Wiring the Cortex MCP server into IBM Bob

The Cortex MCP server speaks **stdio** — Bob spawns it as a subprocess and communicates over standard streams. This document shows where to add the MCP server config in Bob.

## 1. Make sure cortex-api is installed

```bash
cd cortex-api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Verify it runs:

```bash
python -m cortex_api.mcp_server
# (should sit waiting for stdin; Ctrl-C to exit)
```

## 2. Configure Bob to launch it

Bob's MCP servers are configured in its settings file. The exact path may vary by Bob version; the supported format is JSON keyed by server name. Add a `cortex` entry that points at the `python -m cortex_api.mcp_server` command:

```json
{
  "mcpServers": {
    "cortex": {
      "command": "python",
      "args": ["-m", "cortex_api.mcp_server"],
      "cwd": "/absolute/path/to/cortex-api",
      "env": {
        "DIARY_TOKEN": "replace-me-with-a-long-random-string",
        "DIARY_DB_PATH": "/absolute/path/to/cortex-api/data/diary.db",
        "EMBEDDINGS_PROVIDER": "watsonx",
        "WATSONX_API_KEY": "…",
        "WATSONX_PROJECT_ID": "…",
        "WATSONX_URL": "https://us-south.ml.cloud.ibm.com"
      }
    }
  }
}
```

Use absolute paths — Bob may launch the subprocess from its own working directory.

If `EMBEDDINGS_PROVIDER` is `local`, you can omit the `WATSONX_*` variables.

## 3. Sanity-check

After saving, restart Bob (or reload its config). In a Cortex-mode session:

> "Search the Cortex diary for *test*."

Bob should call `diary_recall` and either return results or report "(no results)" — not a tool-not-found error. If Bob reports the tool is unknown, double-check the `mcpServers.cortex` block in settings and that the working directory has `cortex_api` as an importable package.

## 4. Production note

Sharing a SQLite db between the local MCP server (running as a Bob subprocess) and the REST API container (running in Docker) is straightforward — just point both at the same `DIARY_DB_PATH` (mount the host directory into the container in `docker-compose.yml`). With sqlite-vec's WAL journal mode this works without locking issues for the demo's load profile.
