# Cortex

> A developer's second brain, integrated as a first-class IBM Bob extension via MCP, custom mode, skill, slash commands, and mode rules.

**Status:** In development for [IBM Bob Dev Day Hackathon](https://bob.ibm.com), May 1–3, 2026.

## Quick start (one-click install)

```bash
git clone https://github.com/equinox12311/IBM-Bob.git
cd IBM-Bob
make setup     # creates venv, installs Python + npm deps, copies .env
make dev       # starts api on :8080 and web on :5173
```

Then open **http://localhost:5173** and paste `test` as the bearer token.

### For judges — also wire Cortex into Bob (one extra command)

```bash
make judge     # = make setup + make install-bob (copies extensions + patches MCP config)
make dev       # then start the stack
```

`make install-bob` is idempotent: it copies the mode, skill, slash commands, and four mode rules into `~/.bob/`, and registers the `cortex` MCP server in `~/.bob/settings.json` with absolute paths derived from your venv. Restart Bob, switch to the **📓 Cortex** mode, and `/diary-save` will land in the same SQLite the web UI is reading from.

`make setup` is idempotent — safe to re-run if anything changes. The default `.env` uses local sentence-transformers for embeddings (no IBM Cloud creds needed). Switch to `EMBEDDINGS_PROVIDER=watsonx` once you fill in `WATSONX_*` to use IBM watsonx.ai.

### Alternative: Docker

```bash
docker compose up --build      # api:8080, web:8081, bot
# or
make up
```

## Problem

Developers lose 80% of what they figure out, between sessions. Debug discoveries, "why we picked X" decisions, and "tried this didn't work" learnings vanish into Slack scrollback or notes never re-read. AI coding assistants don't remember either; every session starts cold.

## Solution

Cortex is a persistent developer journal that lives inside IBM Bob:

- **Captures from anywhere** — Bob (in-IDE), Telegram (voice/text on mobile), and a web UI
- **Recalls semantically** — RAG-based search; ask "what did I learn about Postgres pooling?" → get the entry with `file:line` citations
- **Proactive surfacing** — when Bob opens a file, related past entries appear *before the developer asks*
- **Agentic auto-capture** — Bob proposes draft entries when a task completes; one-click to confirm
- **Evolves with use** — feedback signals (👍/👎) re-rank entries; recency decays older notes
- **Local-first** — SQLite + sqlite-vec; no developer knowledge leaves the machine

The MCP server is the brain; Bob, Telegram, and the web UI are clients of it.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  cortex-api  (Python · FastAPI + MCP SDK · port 8080)        │
│  MCP tools:    diary_save · diary_recall · diary_link_code   │
│                diary_feedback · diary_timeline               │
│  Storage  :    SQLite + sqlite-vec                           │
│  Embeddings:   watsonx.ai (Granite)                          │
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

## IBM technology used

- **IBM Bob** — five-layer extension (MCP, custom mode, skill, slash commands, mode rules); also used substantively *during the build* by every team member.
- **watsonx.ai** — Granite embeddings for vector search; **Granite 3 8B Instruct** for `/chat`, `/generate/summary`, `/generate/report`; speech-to-text for Telegram voice memos.
- **Local IBM Granite** — `granite-3.1-2b-instruct` GGUF via `llama-cpp-python` for offline / privacy-first runs (same model family, swap with one env var).
- *(Optional)* **watsonx Orchestrate** — agentic auto-capture flow on Bob task completion.
- *(Optional)* **IBM Cloud Code Engine** — public hosting of the web UI.

## Bob extension — five layers

Cortex uses **all five** of Bob's extension surfaces. This is what makes the integration first-class instead of bolted on:

| Layer | File(s) in `bob/` | What it does |
|---|---|---|
| **1. MCP server** | (`cortex-api`, runs separately — see [`bob/MCP_CONFIG.md`](bob/MCP_CONFIG.md)) | Five tools — `diary_save`, `diary_recall`, `diary_link_code`, `diary_feedback`, `diary_timeline` — that Bob calls via `use_mcp_tool`. |
| **2. Custom mode** | [`bob/custom_modes.yaml.example`](bob/custom_modes.yaml.example) | The `📓 Cortex` mode. Auto-loads the skill, includes `mcp` tool group, and orients Bob's behaviour around proactive recall + agentic capture. |
| **3. Skill** | [`bob/skills/cortex/SKILL.md`](bob/skills/cortex/SKILL.md) + [`examples.md`](bob/skills/cortex/examples.md) | The playbook Bob follows — when to capture, when to recall, how to format, the feedback loop. Auto-activated by description match. Includes 4 transcript examples. |
| **4. Slash commands** | [`bob/commands/diary-save.md`](bob/commands/diary-save.md) · [`diary-recall.md`](bob/commands/diary-recall.md) · [`diary-timeline.md`](bob/commands/diary-timeline.md) | Explicit user-driven shortcuts. The save command runs a local secret-detection check before any MCP call. |
| **5. Mode rules** | [`bob/rules-cortex/01-capture-style.md`](bob/rules-cortex/01-capture-style.md) · [`02-no-secrets.md`](bob/rules-cortex/02-no-secrets.md) · [`03-proactive-recall.md`](bob/rules-cortex/03-proactive-recall.md) · [`04-agentic-auto-capture.md`](bob/rules-cortex/04-agentic-auto-capture.md) | Enforces capture style + secret refusal + the two innovations: **proactive recall** on file-open and **agentic auto-capture** on task completion. |

**Install for a judge** ([full guide in `bob/INSTALL.md`](bob/INSTALL.md)):

```bash
cp bob/custom_modes.yaml.example ~/.bob/custom_modes.yaml
cp -r bob/skills/cortex            ~/.bob/skills/
cp -r bob/commands/                ~/.bob/commands/
cp -r bob/rules-cortex             ~/.bob/rules-cortex
# then add a "cortex" entry to Bob's mcpServers (see bob/MCP_CONFIG.md)
```

Restart Bob, switch to the **📓 Cortex** mode, and try `/diary-save your first insight` — or just open a file you've worked on before; Bob will surface related entries automatically.

## Make targets

```
make help        # list targets
make setup       # one-time install (venv + Python + npm + .env)
make install-bob # install Cortex into Bob: mode + skill + commands + rules + MCP config
make judge       # one-command demo: setup + install-bob
make dev         # start api:8080 + web:5173 concurrently
make test        # pytest the backend
make build       # docker compose build
make up          # docker compose up (api:8080, web:8081, bot)
make down        # docker compose down
make lint        # ruff + tsc
make submit      # build Cortex_bob-hackathon_submission.zip
make clean       # remove caches + zip
```

## Docs

- [`docs/PLAN.md`](docs/PLAN.md) — implementation plan, phases, role split, Bob coin allocation
- [`docs/CONTRACTS.md`](docs/CONTRACTS.md) — frozen API contract: MCP tools, REST endpoints, SQLite schema
- [`docs/SUBMISSION.md`](docs/SUBMISSION.md) — judge-facing problem & solution statements
- [`docs/BOB_USAGE.md`](docs/BOB_USAGE.md) — ledger of every IBM Bob session run by each member
- [`docs/AGENT_PROMPT.md`](docs/AGENT_PROMPT.md) — starting prompt for non-Bob AI agents (Claude Code, Cursor, etc.)
- [`docs/TRELLO_BOARD.md`](docs/TRELLO_BOARD.md) — Trello board structure & initial cards
- [`docs/IDEA.md`](docs/IDEA.md) — pitch one-pager for sharing externally
- [`docs/technical_report.md`](docs/technical_report.md) — technical write-up (PDF source)
- [`docs/LICENSE_AUDIT.md`](docs/LICENSE_AUDIT.md) — third-party license audit
- [`docs/bob-sessions/`](docs/bob-sessions/) — exported Bob task-session reports

## Team

| Role | Member | Bob coins |
|---|---|---|
| Team Lead · Bob/DX Lead | Ahmed Abdullah Farooqi | 22 / 40 |
| Backend Lead | TBD | 18 / 40 |
| Frontend Owner | TBD | 18 / 40 |
| AI / Integrations Lead | TBD | 17 / 40 |

## Bob usage statement

_Finalised in Phase 4 before submission. See [`docs/BOB_USAGE.md`](docs/BOB_USAGE.md) for the full session ledger and per-member coin breakdown._

The build is a deliberate Claude-Code-and-Bob split: Claude Code handles scaffolding and lower-leverage glue; **IBM Bob** handles judge-visible, high-leverage work — refactoring core modules, generating the pytest suite, secret scanning, generating the Bob extension manifests (meta), and the live demo session. Each team member exports their Bob task-session reports to `docs/bob-sessions/`.

## License

[MIT](LICENSE) — see [`docs/LICENSE_AUDIT.md`](docs/LICENSE_AUDIT.md) for the full third-party audit.
