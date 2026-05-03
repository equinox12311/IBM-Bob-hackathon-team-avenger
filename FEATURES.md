# Cortex — Features

A complete inventory of what's shipping. Grouped by which tier of the product they belong to.

---

## I. Capture (Memory tier)

| | |
|---|---|
| **Mobile capture** | Centre-FAB on the tab bar opens the Capture screen. Kind selector (Note / Idea / Bug / Fix / Decision / Insight / Snippet / Task), free-text body, comma-separated tags, optional file path. Saves to cortex-api when connected, sqlite-on-device otherwise. |
| **Telegram bot capture** | `cortex-bot` polls Telegram. Plain text → entry. Voice memo → watsonx.ai STT (with faster-whisper fallback) → entry. Photos → entry text + image attachment. |
| **Bob `/diary-save`** | Slash command from inside IBM Bob. Posts via the MCP server to the same backend. |
| **Agentic auto-capture** | When Bob completes a task, mode rule `04-agentic-auto-capture.md` proposes a draft entry summarising what was done; one click to confirm. |
| **Auto-tagging** | Granite suggests 2–4 tags from the body text on demand. |
| **Secrets guard** | Server- and client-side scan blocks AWS keys, GitHub PATs, JWTs, private keys, RSA blocks, and 6 more entropy heuristics before writes. |

## II. Recall (Reasoning tier)

| | |
|---|---|
| **Vector search** | sqlite-vec virtual table over the entries embedding column. Falls back to Python cosine if the extension fails to load. |
| **Recency rerank** | Re-scores hits by `score × exp(-Δt/τ)` so fresh notes outrank stale matches with the same cosine similarity. |
| **Granite RAG chat** | `Ask` tab streams Granite's answer with inline citation chips (`#42`, `#481`). Uses watsonx.ai when the API has credentials, local Granite 2B GGUF otherwise. |
| **Workspace** | Granite chat over diary with explicit "Send to Bob" escalation buttons per turn. |
| **Codebase indexer + analyse** | `apiIndexCodebase` walks any repo, embeds chunks as `kind="code"`. `Explorer` screen lets you ask Granite questions scoped to a single file. |
| **Auto-wiki** | Granite reads diary entries + indexed code, writes a markdown page mirrored to `docs/wiki/<slug>.md`. |
| **Calendar aggregation** | `/api/v1/calendar?month=…` returns entries grouped by day with kind histograms. |
| **Daily report** | `/api/v1/reports/daily?days=N` + `Report` screen render a Granite-written narrative of the period. |
| **Suggest next** | `/api/v1/suggest/next` — Granite suggests three next actions based on recent diary activity. |
| **Proactive recall** | When Bob opens a file you've worked on before, mode rule `03-proactive-recall.md` fires `diary_recall` against the path and surfaces past entries before the developer asks. |

## III. Action (IBM Bob tier)

| | |
|---|---|
| **Custom mode `📓 Cortex`** | Orients Bob's personality and tool selection toward capture/recall. |
| **MCP server** | 6 tools: `diary_save`, `diary_recall`, `diary_link_code`, `diary_feedback`, `diary_timeline`, `diary_pending_actions`. |
| **Skill `cortex`** | `bob/skills/cortex/SKILL.md` — best-practice playbook with examples. |
| **Slash commands** | `/diary-save`, `/diary-recall`, `/diary-timeline`. |
| **Mode rules** | 5 rules driving Bob's behaviour (`bob/rules-cortex/`). |
| **`pending_actions` escalation** | Mobile and web can `POST /api/v1/actions/queue`; Bob consumes them via `diary_pending_actions` at session start. The rule `05-pending-actions.md` maps kinds to behaviours. |
| **Skill creator** | Mobile screen creates / edits / deletes user skills as `bob/skills/<slug>/SKILL.md` with frontmatter validation; `make install-bob` pushes them to `~/.bob/`. |
| **Cron scheduler** | `automations` table with cron expression. Three trigger kinds: `notify` (audit only), `recall` (queues for Bob), `report` (Granite narrative + queue). Tick endpoint, run-now button, validated cron at write time. |

## IV. Mobile UX

| | |
|---|---|
| **One-command boot** | `make start` / `start.bat` / `start.ps1` — installs deps if missing, runs the API, prints a pairing QR + how-to-install-Expo-Go instructions, starts Expo. |
| **One-tap pairing** | The QR encodes `{url, token, v}`. Settings → Scan to connect → camera reads it → AsyncStorage written → `/health` verified. |
| **Apple-style nav bar** | 4 icons-only tabs (Today / Search / Ask / More) + a centre Capture FAB hanging above the bar. |
| **Dark mode** | `useThemeMode` + `ThemeProvider`. Light / Dark / Match system. Preference persisted in expo-secure-store. Every screen consumes the resolved palette via the hook. |
| **First-launch onboarding** | 3-card carousel: Memory · Reasoning · Action. Mirrors the deck narrative. SecureStore flag gates re-show. |
| **Design system** | Nine primitives (`Screen`, `Header`, `Card`, `Button`, `Pill`, `EmptyState`, `Section`, `IconButton`, `StatusBanner`) — every screen composes from these. Light + dark palettes both supported. |

## V. Security

| | |
|---|---|
| **Bearer-token auth** | `DIARY_TOKEN` required on every API write; verified by FastAPI dependency. |
| **Secrets guard** | 11 regex patterns + entropy heuristic; blocks at write time. |
| **CORS hardening** | Wildcard only in dev (`RELOAD=true`); prod whitelists `cortex.dev` + localhost. |
| **Security headers** | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS in non-reload mode. |
| **Server-side rate limiting** | Sliding window per-IP: 60 req/min default, 20 creates/min, 30 searches/min, 10 LLM/min. |
| **Pydantic input validation** | Every endpoint body is a Pydantic model. |
| **Audit log** | Every skill create / update / delete writes a row. The mobile Security screen renders the recent log + 1h/24h/7d summary chart. |

## VI. Quality & DX

| | |
|---|---|
| **124 backend tests** | Pytest, isolated per-test sqlite, deterministic embeddings stub. |
| **Cross-platform launcher** | macOS / Linux / Windows from one Python script. |
| **Idempotent setup** | `make start` and `make install-bob` are both safe to re-run. |
| **Cleanliness archive** | `__archive/` (gitignored) holds pre-cleanup notes; the working tree stays surgical. |
| **HANDOFF.md** | One canonical doc that orients a teammate (or their LLM) without re-reading every commit. |
| **Visual deck** | `cortex-deck.html` — Apple-keynote style 18-slide reveal that any browser can run fullscreen for the demo. |
| **Video brief** | `docs/VIDEO_BRIEF.md` — 3-minute scene-by-scene shot list with voiceover script and asset checklist for production. |
