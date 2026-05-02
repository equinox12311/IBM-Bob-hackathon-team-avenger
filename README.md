# Cortex

> A developer's second brain, integrated as a first-class IBM Bob extension via MCP, custom mode, skill, slash commands, and mode rules.

**Status:** In development for [IBM Bob Dev Day Hackathon](https://bob.ibm.com), May 1–3, 2026.

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

A higher-fidelity diagram lives at `docs/architecture.png` (added in Phase 4).

## IBM technology used

- **IBM Bob** — five-layer extension (MCP, custom mode, skill, slash commands, mode rules); also used substantively *during the build* by every team member (refactor, tests, secret scan, docs, demo session).
- **watsonx.ai** — Granite embeddings for vector search; speech-to-text for Telegram voice memos.
- *(Optional)* **watsonx Orchestrate** — agentic auto-capture flow on Bob task completion.
- *(Optional)* **IBM Cloud Code Engine** — public hosting of the web UI.

## Run me

```bash
# clone + configure
git clone https://github.com/equinox12311/IBM-Bob.git
cd IBM-Bob
cp .env.example .env        # then fill in DIARY_TOKEN, watsonx creds, telegram bot token

# run the full stack (api on :8080, web on :8081, bot polls Telegram)
docker compose up --build

# install Bob extensions (see bob/INSTALL.md for the full guide)
cp bob/custom_modes.yaml.example ~/.bob/custom_modes.yaml
cp -r bob/skills/cortex            ~/.bob/skills/
cp -r bob/commands/                ~/.bob/commands/
cp -r bob/rules-cortex             ~/.bob/rules-cortex
# then wire the Cortex MCP server in Bob settings — see bob/MCP_CONFIG.md
```

Then in Bob, switch to the `📓 Cortex` mode and try `/diary-save your first insight`.

## Docs

- [`docs/PLAN.md`](docs/PLAN.md) — implementation plan, phases, role split, Bob coin allocation
- [`docs/CONTRACTS.md`](docs/CONTRACTS.md) — frozen API contract: MCP tools, REST endpoints, SQLite schema
- [`docs/SUBMISSION.md`](docs/SUBMISSION.md) — judge-facing problem & solution statements
- [`docs/BOB_USAGE.md`](docs/BOB_USAGE.md) — ledger of every IBM Bob session run by each member
- [`docs/AGENT_PROMPT.md`](docs/AGENT_PROMPT.md) — starting prompt for non-Bob AI agents (Claude Code, Cursor, etc.)
- [`docs/TRELLO_BOARD.md`](docs/TRELLO_BOARD.md) — Trello board structure & initial cards
- [`docs/IDEA.md`](docs/IDEA.md) — pitch one-pager for sharing externally
- [`docs/technical_report.pdf`](docs/technical_report.pdf) — technical write-up (added in Phase 4)
- [`docs/bob-sessions/`](docs/bob-sessions/) — exported Bob task-session reports (one per session, all members)

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

## Building the submission

```bash
make submit          # builds Cortex_bob-hackathon_submission.zip at the repo root
```

Excludes `.git/`, `node_modules/`, `__pycache__/`, `.venv/`, the local `data/` SQLite, and any caches. Demo video uploads separately and is linked from this README.
