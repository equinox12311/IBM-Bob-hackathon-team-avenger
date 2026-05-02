# Cortex — common dev + submission tasks.
# Usage:  make <target>
#
# Targets:
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

.DEFAULT_GOAL := help
.PHONY: help build up down test lint submit clean

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| sort \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}' \
		|| awk -F: '/^[a-z][a-zA-Z_-]+:/ {print "  " $$1}' $(MAKEFILE_LIST)

build:  ## docker compose build all 3 services
	docker compose build

up:  ## docker compose up (api:8080, web:8081, bot)
	docker compose up

down:  ## docker compose down
	docker compose down

test:  ## run the pytest suite
	pytest -v

lint:  ## ruff + tsc
	-cd src/cortex-api && python -m ruff check . || true
	-cd src/cortex-bot && python -m ruff check . || true
	-cd src/cortex-web && npx tsc --noEmit || true

submit:  ## build the submission zip
	@echo "Building $(SUBMISSION)…"
	@rm -f $(SUBMISSION)
	@zip -r $(SUBMISSION) $(ZIP_INCLUDE) \
		-x $(addprefix ',$(addsuffix ',$(ZIP_EXCLUDE))) \
		-x '.git/*' \
		-x 'Official Rules*' \
		-x 'claude.md'
	@echo
	@echo "  ✓ $(SUBMISSION) built ($$(du -sh $(SUBMISSION) | cut -f1))"
	@echo
	@echo "Next:"
	@echo "  • Verify with:  unzip -l $(SUBMISSION) | head"
	@echo "  • Upload demo.mp4 separately and link in README"
	@echo "  • Submit via the official hackathon form"

clean:  ## remove caches + zips
	rm -rf .pytest_cache .mypy_cache .ruff_cache
	rm -f $(SUBMISSION)
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
