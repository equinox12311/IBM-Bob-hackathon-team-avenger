#!/usr/bin/env bash
# Launcher for the cortex MCP stdio server.
#
# Used by:
#   - make verify-mcp  (wraps it in @modelcontextprotocol/inspector)
#   - bob mcpServers.cortex.command (manually, in advanced setups)
#
# Sets the env vars cortex_api expects, points at the project venv, and
# runs the server with stdin/stdout free for MCP framing (logs go to stderr).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

: "${DIARY_TOKEN:=test}"
: "${EMBEDDINGS_PROVIDER:=local}"
: "${LLM_PROVIDER:=off}"
: "${DIARY_DB_PATH:=$REPO_ROOT/data/diary.db}"

export DIARY_TOKEN EMBEDDINGS_PROVIDER LLM_PROVIDER DIARY_DB_PATH
export PYTHONPATH="$REPO_ROOT/src/cortex-api"

exec "$REPO_ROOT/.venv/bin/python" -m cortex_api.mcp_server
