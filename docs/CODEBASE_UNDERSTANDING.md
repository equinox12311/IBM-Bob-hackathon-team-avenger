# Cortex Codebase Understanding

## Project Overview

**Cortex** is a developer's persistent journal system built for the IBM Bob Dev Day Hackathon (May 1-3, 2026). It functions as a "second brain" for developers, capturing learnings, decisions, and insights across multiple interfaces and recalling them semantically when needed.

**Key Innovation:** Cortex uses ALL five of IBM Bob's extension layers (MCP server, custom mode, skill, slash commands, and mode rules) to create a first-class integration rather than a bolt-on tool.

## Core Architecture

### Three-Service Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  cortex-api  (Python · FastAPI + MCP SDK · port 8080)        │
│  MCP tools:    diary_save · diary_recall · diary_link_code   │
│                diary_feedback · diary_timeline               │
│  Storage  :    SQLite + sqlite-vec                           │
│  Embeddings:   watsonx.ai (Granite) or local transformers    │
│  Transports:   stdio (Bob)  +  HTTP/SSE (bot, web)           │
└──────────────────────────────────────────────────────────────┘
        ▲                       ▲                     ▲
        │ MCP/stdio             │ HTTP                │ HTTP
┌────────────────┐   ┌─────────────────────┐   ┌──────────────────┐
│  IBM Bob       │   │   cortex-bot        │   │  cortex-web      │
│  📓 mode +     │   │   Telegram          │   │  React + Vite +  │
│  skill + cmds  │   │   voice → STT       │   │  TS + Carbon     │
│  + rules + MCP │   │   text → save       │   │  port 8081       │
└────────────────┘   └─────────────────────┘   └──────────────────┘
```

### 1. Backend API (`src/cortex-api/`)

**Technology Stack:**
- Python 3.11+
- FastAPI for REST endpoints
- MCP SDK for stdio protocol
- SQLite + sqlite-vec for storage
- sentence-transformers or watsonx.ai for embeddings
- llama-cpp-python or watsonx.ai for LLM features

**Key Modules:**

- [`server.py`](../src/cortex-api/cortex_api/server.py) - FastAPI app with REST/SSE endpoints on port 8080
- [`mcp_server.py`](../src/cortex-api/cortex_api/mcp_server.py) - MCP stdio server for IBM Bob integration
- [`tools.py`](../src/cortex-api/cortex_api/tools.py) - Five MCP tool definitions and handlers
- [`storage.py`](../src/cortex-api/cortex_api/storage.py) - SQLite + sqlite-vec wrapper
- [`retrieval.py`](../src/cortex-api/cortex_api/retrieval.py) - Semantic search with re-ranking
- [`embeddings.py`](../src/cortex-api/cortex_api/embeddings.py) - Embedding provider abstraction
- [`secrets.py`](../src/cortex-api/cortex_api/secrets.py) - Secret detection (11 patterns + entropy)
- [`llm.py`](../src/cortex-api/cortex_api/llm.py) - LLM provider abstraction
- [`generate.py`](../src/cortex-api/cortex_api/generate.py) - LLM-powered features (chat, summaries, reports)
- [`features.py`](../src/cortex-api/cortex_api/features.py) - Feature pages (analytics, GitHub, wellness, etc.)
- [`models.py`](../src/cortex-api/cortex_api/models.py) - Pydantic models matching CONTRACTS.md
- [`auth.py`](../src/cortex-api/cortex_api/auth.py) - Bearer token authentication
- [`config.py`](../src/cortex-api/cortex_api/config.py) - Environment-based settings

**Five MCP Tools:**

1. **`diary_save`** - Save a journal entry with optional code location
2. **`diary_recall`** - Semantic search over entries (RAG-based)
3. **`diary_timeline`** - Get recent entries (reverse-chronological)
4. **`diary_link_code`** - Attach code location to existing entry
5. **`diary_feedback`** - Boost (+0.2) or flag (-0.3) an entry's score

**Storage Schema:**

```sql
entries (id, text, created_at, score, source, kind, repo, file, line_start, line_end, tags)
vec_entries (embedding FLOAT[384])  -- virtual table via sqlite-vec
feedback (id, entry_id, signal, ts)
wellness_breaks (id, ts)
user_profile (id, name, handle, bio, pronouns, timezone, public_url)
automations (id, name, trigger_kind, action, enabled, created_at)
```

**Re-ranking Formula:**

```
final_score = entry.score 
            × exp(-λ × days_since_created)    # λ = 0.005
            × cosine_similarity(query_embedding, entry_embedding)
```

**Security Features:**
- Bearer token auth on all REST endpoints
- Secret detection (11 patterns: AWS keys, GitHub tokens, JWTs, etc.)
- Rate limiting (60 req/min default, 20 creates/min, 10 LLM calls/min)
- OWASP security headers (X-Frame-Options, CSP, HSTS, etc.)
- CORS middleware

### 2. Web UI (`src/cortex-web/`)

**Technology Stack:**
- React 18 + TypeScript
- Vite for build tooling
- React Router for navigation
- IBM Carbon Design System
- Port 8081 (Docker) or 5173 (dev)

**Key Pages:**

- **Today Hub** - Greeting, current focus, quick-action tiles
- **Timeline** - Reverse-chron list with filters
- **Search** - Semantic search interface
- **Entry Detail** - Full text + GitHub-linked citations + feedback buttons
- **Ideas** - Bento-grid idea mapper (kind=idea filter)
- **Debug** - Granite chat with citations
- **Report** - 1d/7d/30d aggregates + narrative
- **Analytics** - Live session stats (refreshes every 30s)
- **GitHub** - Contribution heatmap (derived from entry timestamps)
- **Automations** - CRUD for trigger-kind → action rules
- **Wellness** - Touch-grass break tracker
- **Profile** - User profile management
- **Settings** - Configuration

**Key Components:**

- [`Layout.tsx`](../src/cortex-web/src/components/Layout.tsx) - Main layout with navigation
- [`CommandPalette.tsx`](../src/cortex-web/src/components/CommandPalette.tsx) - ⌘K semantic search
- [`useAuth.tsx`](../src/cortex-web/src/hooks/useAuth.tsx) - Authentication hook
- [`client.ts`](../src/cortex-web/src/api/client.ts) - API client with auth

**Security Features:**
- CSRF token validation
- Client-side rate limiting
- Input validation
- Crypto utilities for secure operations

### 3. Telegram Bot (`src/cortex-bot/`)

**Technology Stack:**
- Python 3.11+
- python-telegram-bot library
- Whisper (local) or watsonx STT for voice transcription

**Key Modules:**

- [`main.py`](../src/cortex-bot/cortex_bot/main.py) - Bot bootstrap and polling
- [`handlers.py`](../src/cortex-bot/cortex_bot/handlers.py) - Command and message handlers
- [`transcription.py`](../src/cortex-bot/cortex_bot/transcription.py) - Voice-to-text
- [`api_client.py`](../src/cortex-bot/cortex_bot/api_client.py) - HTTP client for cortex-api
- [`secret_guard.py`](../src/cortex-bot/cortex_bot/secret_guard.py) - Client-side secret detection
- [`config.py`](../src/cortex-bot/cortex_bot/config.py) - Environment settings

**Commands:**
- `/start` - Welcome message
- `/help` - Command list
- `/recall <query>` or `/search <query>` - Semantic search
- `/timeline` - Recent entries
- Text messages → auto-save to diary
- Voice messages → transcribe → save

## IBM Bob Integration (Five Layers)

### 1. MCP Server

**Location:** [`src/cortex-api/cortex_api/mcp_server.py`](../src/cortex-api/cortex_api/mcp_server.py)

**How it works:**
- Runs via `python -m cortex_api.mcp_server`
- Communicates over stdio (stdin/stdout)
- Bob's MCP config points to this command
- Exposes 5 tools that Bob calls via `use_mcp_tool`

**Installation:** See [`bob/MCP_CONFIG.md`](../bob/MCP_CONFIG.md)

### 2. Custom Mode

**Location:** [`bob/custom_modes.yaml.example`](../bob/custom_modes.yaml.example)

**Mode:** `📓 Cortex` (slug: `cortex`)

**Key Behaviors:**
1. **Proactive Recall** - Auto-surfaces related entries on file-open
2. **Agentic Auto-Capture** - Proposes saves on task completion

**Tool Groups:** read, edit (markdown only), command, mcp

### 3. Skill

**Location:** [`bob/skills/cortex/SKILL.md`](../bob/skills/cortex/SKILL.md)

**Purpose:** Playbook for when/how to capture and recall

**Key Guidelines:**
- When to capture (bug resolved, decision made, learning discovered)
- When to recall (proactive on file-open, reactive on questions)
- How to format entries (specific over generic)
- Feedback loop (boost helpful entries, flag stale ones)

**Examples:** [`bob/skills/cortex/examples.md`](../bob/skills/cortex/examples.md)

### 4. Slash Commands

**Location:** [`bob/commands/`](../bob/commands/)

- `/diary-save` - Explicit save with secret detection
- `/diary-recall` - Semantic search
- `/diary-timeline` - Recent entries

### 5. Mode Rules

**Location:** [`bob/rules-cortex/`](../bob/rules-cortex/)

1. **01-capture-style.md** - Entry formatting guidelines
2. **02-no-secrets.md** - Secret refusal rules
3. **03-proactive-recall.md** - Auto-surface on file-open (score > 0.5)
4. **04-agentic-auto-capture.md** - Propose saves on task completion

## IBM Technology Used

1. **IBM Bob** - Five-layer extension (MCP, mode, skill, commands, rules)
2. **watsonx.ai** - Granite embeddings + Granite 3 8B Instruct for LLM features + STT
3. **Local IBM Granite** - granite-3.1-2b-instruct GGUF via llama-cpp-python (offline option)
4. *(Optional)* **watsonx Orchestrate** - Agentic auto-capture flows
5. *(Optional)* **IBM Cloud Code Engine** - Public hosting

## Development Workflow

### One-Click Setup

```bash
make setup     # Creates venv, installs Python + npm deps, copies .env
make dev       # Starts api on :8080 and web on :5173
```

### For Judges

```bash
make judge     # = make setup + make install-bob
make dev       # Start the stack
```

### Docker Deployment

```bash
docker compose up --build  # api:8080, web:8081, bot
# or
make up
```

### Testing

```bash
make test      # Run pytest suite (56 tests)
make lint      # Run ruff + tsc
```

### Submission

```bash
make submit    # Build Cortex_bob-hackathon_submission.zip
```

## Key Features

### Capture (4 Surfaces)
- `/diary-save` in IBM Bob
- Telegram bot (text + voice)
- Web UI quick-actions
- Agentic auto-capture (Bob proposes saves)

### Recall (5 Ways)
- Semantic search (web, Bob, Telegram)
- ⌘K command palette
- Proactive recall (auto-surface on file-open)
- Timeline (reverse-chron with filters)
- Entry detail with citations

### Learning Loop
- 👍 boost (+0.2) / 👎 flag (-0.3)
- Recency decay (λ = 0.005/day)
- Score clamped to [0.1, 5.0]

### LLM-Powered Features
- `POST /api/v1/chat` - RAG chat with [#id] citations
- `POST /api/v1/generate/summary/{id}` - Entry summary
- `GET /api/v1/generate/report?days=N` - Narrative report
- Switch providers: `LLM_PROVIDER=watsonx | local | off`

## Testing Infrastructure

**Location:** [`tests/`](../tests/)

**Test Files:**
- `test_api.py` - FastAPI integration tests
- `test_storage.py` - SQLite + sqlite-vec tests
- `test_retrieval.py` - Search and re-ranking tests
- `test_secrets.py` - Secret detection tests
- `test_tools.py` - MCP tool tests
- `test_bot_secret_guard.py` - Telegram bot secret guard tests
- `test_security_phase2.py` - Security feature tests

**Test Infrastructure:**
- `conftest.py` - Pytest fixtures (client, temp DB, auth headers)
- `README.md` - Testing documentation

**Coverage:** 56 tests passing

## Security Features

### Secret Detection
- 11 patterns: AWS keys, GitHub tokens, Slack tokens, OpenAI keys, Stripe keys, JWTs, private keys, etc.
- Entropy heuristic for generic secrets
- Server-side (HTTP 422) + client-side (Telegram bot)
- Redacted findings in error responses

### Authentication & Authorization
- Bearer token auth on all REST endpoints (except `/health`)
- Single shared secret in `.env` (never committed)
- MCP transport (stdio) is local-only, inherits OS user

### Rate Limiting
- In-memory sliding window
- 60 req/min per IP (default)
- 20 creates/min
- 30 searches/min
- 10 LLM calls/min

### Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: restrictive
- HSTS (production only)
- Server fingerprint removed

### Input Validation
- Pydantic models for all requests
- CSRF token validation (web UI)
- Client-side rate limiting (web UI)

## Project Structure

```
.
├── README.md                    # Main documentation
├── LICENSE                      # MIT license
├── .gitignore
├── .env.example                 # Environment template
├── docker-compose.yml           # 3-service orchestration
├── Makefile                     # Dev + submission tasks
├── team_info.json               # Team metadata
├── requirements-minimal.txt     # Minimal Python deps
├── docs/                        # Documentation
│   ├── PLAN.md                  # Master plan (single source of truth)
│   ├── CONTRACTS.md             # Frozen API/data contracts
│   ├── FEATURES.md              # Feature inventory
│   ├── IDEA.md                  # Pitch one-pager
│   ├── SUBMISSION.md            # Judge-facing statements
│   ├── BOB_USAGE.md             # Bob session ledger
│   ├── AGENT_PROMPT.md          # Non-Bob AI agent prompt
│   ├── TRELLO_BOARD.md          # Trello structure
│   ├── TEAM.md                  # Team info
│   ├── technical_report.md      # Technical write-up
│   ├── LICENSE_AUDIT.md         # Third-party license audit
│   ├── bob-sessions/            # Exported Bob reports
│   └── security/                # Security docs
├── src/
│   ├── cortex-api/              # Python backend (port 8080)
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── requirements-no-llm.txt
│   │   ├── pyproject.toml
│   │   └── cortex_api/          # Python package
│   ├── cortex-web/              # React frontend (port 8081)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   └── cortex-bot/              # Telegram bot
│       ├── Dockerfile
│       ├── requirements.txt
│       └── cortex_bot/
├── bob/                         # Bob extensions
│   ├── custom_modes.yaml.example
│   ├── INSTALL.md
│   ├── MCP_CONFIG.md
│   ├── skills/cortex/
│   ├── commands/
│   └── rules-cortex/
├── tests/                       # Pytest suite
├── scripts/                     # Utility scripts
│   ├── install-bob.py
│   └── run-mcp-server.sh
├── assets/                      # UI mockups, screenshots
└── cortex-mobile/               # React Native app (optional)
```

## Environment Configuration

**Key Variables:**

```bash
# Auth
DIARY_TOKEN=<bearer-token>

# Storage
DIARY_DB_PATH=data/diary.db

# Embeddings
EMBEDDINGS_PROVIDER=local|watsonx

# LLM
LLM_PROVIDER=off|local|watsonx

# watsonx.ai
WATSONX_API_KEY=<key>
WATSONX_PROJECT_ID=<id>
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_EMBED_MODEL=ibm/slate-30m-english-rtrvr
WATSONX_LLM_MODEL=ibm/granite-3-8b-instruct

# Local Granite
LOCAL_LLM_GGUF_PATH=models/granite-3.1-2b-instruct-Q4_K_M.gguf

# Telegram
TELEGRAM_BOT_TOKEN=<token>
TRANSCRIPTION_PROVIDER=whisper-local|watsonx-stt

# Web
VITE_API_BASE_URL=http://localhost:8080
```

## Team & Roles

| Role | Member | Bob Coins |
|------|--------|-----------|
| Team Lead · Bob/DX Lead | Ahmed Abdullah Farooqi | 22 / 40 |
| Backend Lead | TBD | 18 / 40 |
| Frontend Owner | TBD | 18 / 40 |
| AI / Integrations Lead | TBD | 17 / 40 |

**Total Pool:** 160 coins  
**Planned Spend:** ~75 coins  
**Reserve:** ~85 coins

## Hackathon Timeline

| Phase | Hours | Goal |
|-------|-------|------|
| P0 Setup | 0-2 | Repo cloned, contracts confirmed, envs ready |
| P1 Skeletons | 2-8 | Each layer's stub in place, parallel work |
| P2 Vertical slice | 8-20 | Telegram → MCP → Web works end-to-end |
| P3 Feature complete | 20-32 | All 5 MCP tools, all clients, tests, security |
| P4 Demo + packaging | 32-40 | Live Bob demo, technical report, deploy |
| P5 Buffer + submit | 40-46 | License audit, build zip, submit |

## Not Implemented (Honest List)

- iOS/Android native shells (web is responsive)
- Real GitHub API integration (heatmap derived from timestamps)
- watsonx Orchestrate flows (architecture leaves space)
- Multi-user / shared diaries (single-user by design)
- Slack / Discord / WhatsApp (Telegram only)

## Key Innovations

1. **Proactive Recall** - Bob auto-surfaces related entries when opening files (score > 0.5)
2. **Agentic Auto-Capture** - Bob proposes saves on task completion (one-click confirm)
3. **Five-Layer Bob Integration** - Uses ALL extension surfaces (MCP, mode, skill, commands, rules)
4. **Learning Loop** - Feedback signals (boost/flag) + recency decay evolve the diary over time
5. **Local-First** - SQLite + sqlite-vec; no developer knowledge leaves the machine

## Installation for Judges

```bash
# 1. Clone and setup
git clone https://github.com/equinox12311/IBM-Bob.git
cd IBM-Bob
make judge     # = make setup + make install-bob

# 2. Start services
make dev       # api:8080, web:5173

# 3. Open web UI
# http://localhost:5173 (paste "test" as bearer token)

# 4. Use in Bob
# Restart Bob, switch to "📓 Cortex" mode
# Try: /diary-save your first insight
# Or: open a file you've worked on before
```

## Verification Without Bob

```bash
# Use MCP Inspector to test tools without burning Bob coins
make verify-mcp
# Opens browser, try diary_save and diary_recall tools
```

## Summary

Cortex is a production-ready developer journal system that demonstrates deep integration with IBM Bob through all five extension layers. It combines semantic search (RAG), learning loops (feedback + recency decay), and proactive AI behaviors (auto-recall, auto-capture) to create a persistent memory layer for developers. The architecture is clean, well-tested (56 tests), secure (secret detection, auth, rate limiting), and deployable via Docker or local dev setup.