# Cortex — common dev + submission tasks.
# Usage:  make <target>
#
# One-click install + run:
#   make setup    # create venv, install all deps (Python + npm) — one-time
#   make dev      # start api on :8080 and web on :5173 concurrently
#
# Other targets:
#   help          this listing
#   build         docker compose build
#   up            docker compose up
#   down          docker compose down
#   test          pytest the backend
#   lint          ruff + tsc
#   submit        build the hackathon submission zip

TEAM_NAME    ?= Cortex
SUBMISSION    = $(TEAM_NAME)_bob-hackathon_submission.zip
ZIP_INCLUDE   = README.md LICENSE .env.example docker-compose.yml team_info.json \
                src bob docs tests assets Makefile
ZIP_EXCLUDE   = "*.pyc" "__pycache__/*" "*.egg-info/*" \
                ".venv/*" "venv/*" "env/*" \
                "node_modules/*" "dist/*" ".vite/*" \
                "*.db" "*.sqlite*" "data/*" \
                ".DS_Store" ".pytest_cache/*" ".mypy_cache/*" \
                "*.local"

PY            = .venv/bin/python
PIP           = .venv/bin/pip
DIARY_TOKEN  ?= test
EMBEDDINGS_PROVIDER ?= local

.DEFAULT_GOAL := help
.PHONY: help setup start dev judge install-bob verify-mcp build up down test lint submit clean pair stop

help:  ## list targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| sort \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

setup:  ## one-time install: venv + pip + npm
	@echo "▶ Creating venv at .venv/"
	@test -d .venv || python3 -m venv .venv
	@echo "▶ Installing Python deps for cortex-api"
	@$(PIP) install --upgrade pip
	@$(PIP) install -r src/cortex-api/requirements.txt
	@echo "▶ Installing Python deps for cortex-bot"
	@$(PIP) install -r src/cortex-bot/requirements.txt
	@echo "▶ Installing test deps"
	@$(PIP) install pytest httpx
	@echo "▶ Installing npm deps for cortex-web"
	@cd src/cortex-web && npm install
	@test -x src/cortex-web/node_modules/.bin/vite \
		|| { echo "✗ npm install did not produce node_modules/.bin/vite — check the output above"; exit 1; }
	@echo "▶ Bootstrapping .env"
	@test -f .env || cp .env.example .env
	@echo
	@echo "✓ Setup complete. Run:  make dev"

install-bob:  ## install Cortex into Bob (~/.bob): mode + skill + commands + rules + MCP config
	@command -v $(PY) > /dev/null || { echo "Run 'make setup' first."; exit 1; }
	@$(PY) scripts/install-bob.py

pair:  ## one-click mobile pairing: print a QR with API URL + token
	@command -v $(PY) > /dev/null || { echo "Run 'make setup' first."; exit 1; }
	@$(PY) scripts/pair.py

start:  ## one-command boot (mac/linux/windows): install if needed, start API, print QR, start Expo
	@python3 scripts/start.py 2>/dev/null || python scripts/start.py

stop:  ## stop the background API server started by `make start`
	@if [ -f .logs/api.pid ]; then \
		pid=$$(cat .logs/api.pid); \
		kill $$pid 2>/dev/null && echo "✓ stopped API (PID $$pid)" || echo "API not running"; \
		rm -f .logs/api.pid; \
	else \
		echo "no .logs/api.pid — nothing to stop"; \
	fi

verify-mcp:  ## launch MCP Inspector against the cortex server (verifies tools without burning Bob coins)
	@command -v $(PY) > /dev/null || { echo "Run 'make setup' first."; exit 1; }
	@command -v npx > /dev/null || { echo "npx is required. Install Node 18+."; exit 1; }
	@chmod +x scripts/run-mcp-server.sh
	@echo "▶ Launching MCP Inspector — opens in your browser. Try the diary_save and diary_recall tools."
	@echo "  (Server logs go to stderr; the inspector handles stdin/stdout framing.)"
	@npx -y @modelcontextprotocol/inspector scripts/run-mcp-server.sh

judge:  ## one-command demo prep: setup + install-bob (then run 'make dev')
	@$(MAKE) setup
	@$(MAKE) install-bob
	@echo
	@echo "✓ Cortex installed into Bob. Run 'make dev' to start api+web."

dev:  ## start api (8080) + web (5173) for local development
	@command -v $(PY) > /dev/null || { echo "Run 'make setup' first."; exit 1; }
	@echo "▶ Starting api on :8080 and web on :5173"
	@trap 'echo "▼ stopping…"; kill 0' EXIT INT TERM; \
	 ( DIARY_TOKEN=$(DIARY_TOKEN) EMBEDDINGS_PROVIDER=$(EMBEDDINGS_PROVIDER) \
	   PYTHONPATH=src/cortex-api $(PY) -m cortex_api 2>&1 \
	   | sed 's/^/[api] /' ) & \
	 ( cd src/cortex-web && npm run dev 2>&1 \
	   | sed 's/^/[web] /' ) & \
	 wait

build:  ## docker compose build all 3 services
	docker compose build

up:  ## docker compose up (api:8080, web:8081, bot)
	docker compose up

down:  ## docker compose down
	docker compose down

test:  ## run the pytest suite
	$(PY) -m pytest -v

lint:  ## ruff + tsc
	-cd src/cortex-api && $(PY) -m ruff check . || true
	-cd src/cortex-bot && $(PY) -m ruff check . || true
	-cd src/cortex-web && npx tsc --noEmit || true

submit:  ## build the submission zip
	@echo "Building $(SUBMISSION)…"
	@rm -f $(SUBMISSION)
	@zip -r $(SUBMISSION) $(ZIP_INCLUDE) \
		-x $(addprefix ',$(addsuffix ',$(ZIP_EXCLUDE))) \
		-x '.git/*' \
		-x 'Official Rules*' \
		-x 'claude.md' \
		-x 'Ui/*'
	@echo
	@echo "  ✓ $(SUBMISSION) built ($$(du -sh $(SUBMISSION) | cut -f1))"

clean:  ## remove caches + zips
	rm -rf .pytest_cache .mypy_cache .ruff_cache
	rm -f $(SUBMISSION)
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
