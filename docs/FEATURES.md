# Cortex — what's built

This is the running inventory of working functionality. Updated as features land on `main`.

## Capture (4 surfaces)

- **`/diary-save` slash command** in IBM Bob
- **Telegram bot** — text + voice (IBM Speech to Text or Whisper local)
- **Web UI** — Today quick-actions (Log Fix / Save Decision / Quick Note) and idea capture
- **Agentic auto-capture** — Bob mode rule proposes a save on task completion

## Recall (5 ways)

- **Semantic search** (web `/search`, Bob slash, Telegram `/recall`)
- **`⌘K` command palette** anywhere in the web UI
- **Proactive recall** — Bob auto-surfaces related entries on file-open
- **Timeline** — reverse-chron list with kind/source filters
- **Entry detail** — full text + GitHub-linked `file:line` citation + feedback buttons

## Learning loop

- 👍 boost / 👎 flag — `entry.score` clamped to `[0.1, 5.0]`
- Recency decay — `λ = 0.005/day`
- Final ranking: `score · exp(-λ · days_since_created) · cosine_similarity`

## LLM-powered (IBM Granite — watsonx 8B or local 2B GGUF)

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/chat` | RAG chat over your journal with `[#id]` citations |
| `POST /api/v1/generate/summary/{id}` | One-line summary of any entry |
| `GET /api/v1/generate/report?days=N` | Narrative daily/weekly summary |
| `GET /api/v1/llm/info` | Current provider name + availability |

Switch with one env flag: `LLM_PROVIDER=watsonx | local | off`.

## Feature pages (web UI, Carbon Design System)

- **Today** — greeting · current focus · counts by kind · 3 quick-action tiles
- **Timeline** · **Search** · **Entry detail** · **Settings**
- **Ideas** — bento-grid idea mapper (kind=idea filter)
- **Debug** — Granite chat with citations (falls back to recall if LLM off)
- **Report** — 1d / 7d / 30d aggregates + narrative
- **Analytics** — live session stats, refreshes every 30 s
- **GitHub** — contribution heatmap (derived from entry timestamps)
- **Automations** — CRUD for trigger-kind → action rules
- **Wellness** — touch-grass break tracker with overdue signal
- **Profile** — name / handle / bio / timezone / public URL
- **`⌘K` command palette** — semantic search anywhere

## Safety & ops

- **Server-side secret detection** — 11 patterns (AWS / GitHub / Slack / OpenAI / Stripe / JWT / private keys / …) + entropy heuristic; returns HTTP 422 with redacted findings
- **Client-side secret guard** in the Telegram bot — refuses before round-trip
- **Bearer auth** on every non-health endpoint
- **No-secrets** Bob mode rule

## IBM Bob — five layers

| Layer | What |
|---|---|
| **1. MCP server** | 5 tools — `diary_save`, `diary_recall`, `diary_link_code`, `diary_feedback`, `diary_timeline` |
| **2. Custom mode** | `📓 Cortex` (`bob/custom_modes.yaml.example`) |
| **3. Skill** | `bob/skills/cortex/SKILL.md` + `examples.md` |
| **4. Slash commands** | `/diary-save`, `/diary-recall`, `/diary-timeline` |
| **5. Mode rules** | Capture style · no-secrets · proactive recall · agentic auto-capture |

## Build infra

- One-click install: `make setup && make dev`
- Docker compose stack — api:8080 · web:8081 · bot
- **56 pytest tests passing**
- License audit (`docs/LICENSE_AUDIT.md`)
- 4-page technical report (`docs/technical_report.md`)
- Submission zip via `make submit`

## Not implemented (honest list)

- iOS / Android native shells (web is responsive + has a bottom nav for mobile)
- Real GitHub API integration (heatmap derived from entry timestamps; v2 enhancement)
- watsonx Orchestrate flows (architecture leaves space; not wired)
- Multi-user / shared diaries (single-user by design for hackathon)
- Slack / Discord / WhatsApp (Telegram only)
- Real recording of `demo.mp4` and Bob task-session reports (these are team-only deliverables)
