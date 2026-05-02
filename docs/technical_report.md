# Cortex — Technical Report

> IBM Bob Dev Day Hackathon · 2026 · 4-page A4 technical write-up
> Source for `technical_report.pdf` (export via `pandoc --pdf-engine=tectonic technical_report.md -o technical_report.pdf -V geometry:a4paper -V geometry:margin=2cm`).

## 1. Problem & Solution (≈ ½ page)

Software engineers generate valuable but ephemeral knowledge constantly — debug discoveries, design rationale, "tried-this-didn't-work" learnings. Most of it is lost between sessions. AI coding assistants don't help: they start cold every session. The cost is the **re-derivation tax** — engineers solve the same problem twice, ask the AI the same question twice, or repeat past mistakes.

**Cortex** is a developer's persistent journal that lives inside IBM Bob. It removes the two friction points that doom existing journaling tools:

1. **Capture is frictionless.** Voice memo from Telegram (transcribed by IBM Speech to Text), `/diary-save` slash command in Bob, or *agentic auto-capture* — when Bob completes a task, it proposes a draft entry summarising what was done and why, requiring only one click to confirm.
2. **Recall is proactive.** When Bob opens a file you have worked on before, Cortex automatically surfaces relevant past entries — *before the developer asks*. A custom Bob mode rule fires `diary_recall` against the file's path; matched entries appear in Bob's sidebar with `file:line` citations.

Cortex is built as a first-class IBM Bob extension using **all five extension surfaces** Bob exposes (MCP server, custom mode, skill, slash commands, mode rules) and uses **watsonx.ai** for embeddings and **IBM Speech to Text** for voice transcription. Storage is local-first (SQLite + sqlite-vec); nothing leaves the machine except the embedding/STT requests to IBM.

## 2. Architecture (≈ 1 page)

### 2.1 Component diagram

```
┌──────────────────────────────────────────────────────────────┐
│  cortex-api  (Python 3.11 · FastAPI + MCP SDK · port 8080)   │
│  MCP tools:    diary_save · diary_recall · diary_link_code   │
│                diary_feedback · diary_timeline               │
│  Storage  :    SQLite + sqlite-vec  (single-file, local)     │
│  Embeddings:   watsonx.ai (primary) · sentence-transformers  │
│                MiniLM-L6-v2 (fallback)                       │
│  Transports:   stdio (Bob)  +  HTTP/SSE (bot, web)           │
└──────────────────────────────────────────────────────────────┘
        ▲ MCP/stdio              ▲ HTTP                ▲ HTTP
┌────────────────┐    ┌─────────────────────┐   ┌──────────────────┐
│  IBM Bob       │    │   cortex-bot        │   │  cortex-web      │
│  📓 mode +     │    │   Telegram          │   │  React + Vite +  │
│  skill + cmds  │    │   IBM STT or        │   │  TS + Carbon     │
│  + rules + MCP │    │   Whisper fallback  │   │  port 8081       │
└────────────────┘    └─────────────────────┘   └──────────────────┘
```

### 2.2 Three services, one brain

The **`cortex-api`** service is the only place that knows about storage. It exposes the same five operations over two transports: an HTTP REST API (used by the web UI and the Telegram bot) and an MCP stdio transport (used by Bob). Both transports share the same handlers in `cortex_api.tools`, so behaviour is identical regardless of which client speaks.

The **`cortex-web`** service is a plain React + Vite + TypeScript SPA built against the IBM Carbon Design System. Pages: Login (mock token entry), Timeline (reverse-chron), Search (semantic), EntryDetail (full text + citations + feedback), Settings (API base URL + token). A ⌘K command palette gives quick semantic search from anywhere.

The **`cortex-bot`** service is a `python-telegram-bot` long-poller. Text messages are saved as `telegram-text` entries; voice messages are downloaded as Opus, transcribed by IBM Speech to Text (or `faster-whisper` locally), and saved as `telegram-voice` entries. `/recall <topic>` and `/timeline` mirror the API endpoints.

### 2.3 The two innovations

**Proactive recall** is implemented as a Bob mode rule (`bob/rules-cortex/03-proactive-recall.md`). When a file is opened or focused, Bob composes a query from the file path plus prominent class/function names and calls `diary_recall`. Entries with `final_score > 0.5` are surfaced as a one-line header followed by the top 3, citing `file:line` where present. If nothing matches, the rule stays silent.

**Agentic auto-capture** is implemented as a separate mode rule (`bob/rules-cortex/04-agentic-auto-capture.md`). Bob watches the conversation for task-completion signals (test pass, "that fixed it", commit announcement, refactor finish). On detection it composes a one-sentence learning summary in the developer's voice and proposes a `diary_save`. The save is never silent — the developer confirms before the tool call.

### 2.4 Data model

```
entries(id, text, created_at, score, source, repo, file, line_start, line_end, tags)
vec_entries(rowid → entries.id, embedding FLOAT[384])      -- sqlite-vec virtual table
feedback(id, entry_id, signal ∈ {boost, flag}, ts)
```

Vectors are unit-normalised at embedding time. sqlite-vec MATCH returns L2 distance, which the retrieval layer converts to cosine similarity (`cos = 1 − L2² / 2`).

## 3. Data flow (≈ ½ page)

**Capture (developer-on-the-bus).** Voice memo → Telegram bot → bytes downloaded → temp file → IBM STT (or Whisper) → transcript → secret-detection check (refuse if AWS key / GitHub token / JWT / private key block) → `POST /api/v1/entries` with `source: "telegram-voice"` → embed → persist + vector insert → entry id returned to bot → user sees confirmation.

**Recall (developer-in-Bob).** Developer asks "why Postgres pooling?" → Bob (Cortex mode) calls `diary_recall("Postgres pooling", k=5)` over MCP stdio → server embeds query → over-fetches `k×3` candidates via vec_entries MATCH → re-ranks by `entry.score · exp(−λ·days) · cosine` (λ = 0.005/day) → returns top-k → Bob renders with `file:line` citations.

**Feedback loop.** Developer reads recalled entry, says "that helped" → Bob calls `diary_feedback(id, "boost")` → server adds 0.2 to `entry.score`, clamped to [0.1, 5.0] → next recall ranks this entry higher.

## 4. How IBM Bob was used (≈ ¾ page)

Cortex deliberately splits work between Claude Code (scaffolding, glue) and IBM Bob (judge-visible, high-leverage). The **per-member ledger** in `docs/BOB_USAGE.md` records every Bob session with commit hash, coin spend, and exported task-session report under `docs/bob-sessions/`.

| Member | Bob-driven work (planned ~75 of 160 coins) | Artifact |
|---|---|---|
| **M1** | Bob extension manifests (mode YAML, SKILL.md, rules including proactive-recall + agentic-auto-capture); README final + Bob usage statement; **the live demo session** in the video | mode/skill/rules + README + demo footage |
| **M2** | Refactor `cortex_api/storage.py` and `tools.py` into clean modules; generate the pytest suite (`tests/test_*.py`); secret/security scan via Bob Findings panel | Cleaner modules + green pytest + scan report |
| **M3** | Generate Carbon-based UI components (Timeline, Search, EntryDetail, ⌘K palette); accessibility scan + UI test scaffolds | Components + a11y report |
| **M4** | Generate transcription pipeline + watsonx.ai embeddings client + secret-detection middleware; integration tests; refactor of `cortex-bot` | Transcription module + middleware + tests |

The hackathon's core ask — "show Bob's ability to read full repo context" — is answered structurally: Cortex *is* the context surface that Bob reads from at runtime via MCP. Beyond build-time use, Bob is a runtime consumer of our product.

**Cross-tool attribution.** Per the rules, Claude-generated portions are clearly separated. Each commit message names the generating tool (e.g. `Generated by IBM Bob (M2) — session #3`). The `docs/BOB_USAGE.md` ledger lists every session per IBM ID. No work generated by Claude Code is claimed to be Bob's.

## 5. Performance and scale (≈ ¼ page)

For the hackathon load profile (single user, < 10 k entries):

- **Embed latency.** watsonx.ai Slate-30m: ~70 ms / call (network-bound). Local MiniLM fallback: ~25 ms / call on a modern laptop CPU. Both acceptable for synchronous inserts.
- **KNN latency.** sqlite-vec MATCH over 10 k vectors at 384 dim: under 5 ms wall time (no index tuning needed).
- **Re-ranking.** Cosine + recency decay applied in Python; negligible on top of KNN.
- **End-to-end recall** (Bob ↔ MCP stdio ↔ embed ↔ KNN ↔ rerank ↔ render): **typically < 200 ms** with watsonx, **< 80 ms** with local embeddings.

Scale path (post-hackathon): swap SQLite for IBM Db2 + pgvector when entry count enters the 100 k–1 M range; add per-team partitioning for multi-tenant deployments.

## 6. Challenges (≈ ¼ page)

- **Bob's MCP config format wasn't in the public docs.** Solved by spiking on Hour 0–2 and documenting the exact `mcpServers` JSON shape in `bob/MCP_CONFIG.md` so judges can reproduce.
- **sqlite-vec extension availability.** Some Python builds disable extension loading. We added a Python-cosine fallback in `storage.py` so the API stays functional even without the extension; tests cover both paths.
- **L2 ↔ cosine.** sqlite-vec returns L2 by default; for unit-normalised vectors the conversion is exact: `cos = 1 − L2² / 2`. Verified by unit test.
- **48-hour scope discipline.** Cut early and explicitly: Slack/WhatsApp/email integrations, native iOS/Android (replaced with optional Capacitor wrap), real auth backend, true RL fine-tuning. Documented in `docs/PLAN.md::13` so the cuts are visible to judges, not hidden.

## 7. Submission package

`Cortex_bob-hackathon_submission.zip` contains: `README.md` · `LICENSE` · `docker-compose.yml` · `team_info.json` · `src/cortex-{api,bot,web}/` · `bob/` · `tests/` · `docs/` (incl. this report, `BOB_USAGE.md`, `bob-sessions/`, `LICENSE_AUDIT.md`) · `assets/`. Build via `make submit` from the repo root. Demo video uploaded separately and linked from README.
