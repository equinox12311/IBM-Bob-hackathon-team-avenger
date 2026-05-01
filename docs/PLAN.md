# Cortex — Master Plan

> A developer's second brain integrated with IBM Bob via MCP, custom mode, skill, slash commands, and mode rules.
>
> **Hackathon:** IBM Bob Dev Day · May 1–3, 2026 · **Submit by Sunday 10:00 AM ET (= 15:00 BST)**
>
> **Theme:** *"Turn idea into impact faster with IBM Bob"*

This is the **single source of truth** for the project. Slack/Discord messages do not override this file. If something contradicts it, fix this file via PR or fix the contradiction.

**Companion docs:**
- [`CONTRACTS.md`](CONTRACTS.md) — frozen API/data contracts
- [`SUBMISSION.md`](SUBMISSION.md) — judge-facing problem & solution statements
- [`BOB_USAGE.md`](BOB_USAGE.md) — ledger of every IBM Bob session
- [`AGENT_PROMPT.md`](AGENT_PROMPT.md) — starting prompt for non-Bob AI agents
- [`TRELLO_BOARD.md`](TRELLO_BOARD.md) — board structure + initial cards
- [`IDEA.md`](IDEA.md) — pitch one-pager for sharing externally

---

## 1. The pitch

Developers lose 80% of what they figure out, between sessions. **Cortex** is a persistent dev journal native to IBM Bob: capture from anywhere (Bob, voice on Telegram, web), recall semantically when Bob touches a relevant file, and let the diary evolve via feedback. Cortex is a first-class IBM Bob extension — using all five extension layers Bob exposes (MCP, mode, skill, slash commands, rules) — and uses watsonx.ai for embeddings + STT.

## 2. Team & roles

| Code | Name | Role | Specialty | GitHub | Bob coins |
|---|---|---|---|---|---|
| **M1** | Ahmed Abdullah Farooqi | **Team Lead · Bob/DX Lead** | Backend / AI | TBD | 22 / 40 |
| **M2** | TBD | **Backend Lead** | Backend / AI | TBD | 18 / 40 |
| **M3** | TBD | **Frontend Owner** | Frontend | TBD | 18 / 40 |
| **M4** | TBD | **AI / Integrations Lead** | Backend / AI | TBD | 17 / 40 |

Total Bob pool: **160**. Planned spend: **~75**. Reserve: **~85**.

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  cortex-api  (Python 3.11 · FastAPI + MCP SDK · port 8080)   │
│  ──────────────────────────────────────────────────────────  │
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
│  📓 mode +     │    │  Telegram           │   │  React + Vite    │
│  skill + cmds  │    │  voice→watsonx STT  │   │  + TS + Carbon   │
│  + rules + MCP │    │  text→save · /recall│   │  port 8081       │
└────────────────┘    └─────────────────────┘   └──────────────────┘
```

All three services are containerised and orchestrated via `docker-compose.yml`. The API listens on **port 8080** as required by the submission spec. See [`CONTRACTS.md`](CONTRACTS.md) for the frozen API surface.

## 4. Submission deliverables (mapped to repo)

| # | Deliverable | Where it lives | Owner | Phase due |
|---|---|---|---|---|
| 1 | `README.md` (overview · architecture diagram · IBM tech list · run-me) | repo root | M1 | P3 → P4 |
| 2 | `src/` source code | `cortex-api/`, `cortex-web/`, `cortex-bot/`, `bob/` | All | P1–P3 |
| 3 | `Dockerfile` per service + `docker-compose.yml` | per dir + repo root | M2/M3/M4 | P3 |
| 4 | App listens on **port 8080** | `cortex-api/` | M2 | P1 |
| 5 | `demo.mp4` (≤5 min, 1080p H.264, ≤200 MB) | uploaded externally | M1 | P4 |
| 6 | `technical_report.pdf` (A4, ≤4 pages) | `docs/technical_report.pdf` | M1 | P4 |
| 7 | `tests/` | `tests/` | M2 | P3 |
| 8 | `LICENSE` (MIT) | repo root | M1 | P0 |
| 9 | `team_info.json` | repo root | M1 | P0 → P5 |
| 10 | `assets/` (UI mockups / screenshots) | `assets/` | M3 | P4 |
| 11 | All Bob session reports | `docs/bob-sessions/` | All | every session |
| 12 | Bob usage statement | README + `docs/BOB_USAGE.md` | M1 | P4 |
| 13 | **Final zip** `Cortex_bob-hackathon_submission.zip` | local then upload | M1 | P5 |

## 5. GitHub & branching

**Repo:** [`https://github.com/equinox12311/IBM-Bob`](https://github.com/equinox12311/IBM-Bob) — owned by M1 (Ahmed). Invite M2/M3/M4 with write access.

**Protection on `main`:** No direct pushes. All work via PR.

**Branch model:**
- `main` — protected; only shippable code (M1 promotes from `dev` at end of each phase)
- `dev` — integration branch; all feature PRs land here first
- `feat/<short-name>` — feature branches (e.g. `feat/diary-save-tool`, `feat/web-timeline-page`)
- `chore/<thing>` — non-feature work (e.g. `chore/dockerfile`, `chore/license`)
- `fix/<bug>` — bug fixes

**PR rules:**
- Title format: `[area] short verb-led description` (e.g. `[backend] persist entries with sqlite-vec`)
- Body must include: what changed · how to test · linked Trello card · whether Bob was used (and which session)
- ≥1 review required · CI green · no merge conflicts
- Squash-merge to keep history clean

## 6. Level 0 — initial push (now)

The repo we push to GitHub at Hour 0 contains **only this skeleton — no implementation code yet**. Everyone clones from this baseline.

```
.
├── README.md
├── LICENSE                   (MIT)
├── .gitignore
├── .env.example
├── docker-compose.yml
├── team_info.json
├── docs/
│   ├── PLAN.md               ← this file
│   ├── CONTRACTS.md
│   ├── SUBMISSION.md
│   ├── BOB_USAGE.md
│   ├── AGENT_PROMPT.md
│   ├── TRELLO_BOARD.md
│   ├── IDEA.md
│   ├── bob-sessions/         (empty; per-member exports go here)
│   └── security/             (empty; secret-scan reports go here)
├── src/
│   ├── cortex-api/           (Python: MCP server + REST API, port 8080)
│   ├── cortex-web/           (React + Vite + TS UI, port 8081)
│   └── cortex-bot/           (Telegram bot)
├── bob/
│   ├── custom_modes.yaml.example
│   ├── skills/cortex/        (empty)
│   ├── commands/             (empty)
│   └── rules-cortex/         (empty)
├── tests/                    (empty)
└── assets/                   (empty)
```

After M1 pushes Level 0 to `main`, all subsequent work happens on **feature branches → PR to `dev`**.

## 7. Phased timeline (46 hours)

| Phase | Hours | Goal | DoD |
|---|---|---|---|
| **P0** Setup | 0–2 | Repo cloned, contracts confirmed, envs ready | All 4 push a "hello-world" branch |
| **P1** Skeletons | 2–8 | Each layer's stub in place, parallel work, no integration | All skeletons merged to `dev` |
| **P2** Vertical slice | 8–20 | Telegram → MCP → Web works end-to-end | `v0.1-vertical-slice` tag |
| **P3** Feature complete | 20–32 | All 5 MCP tools, all clients, tests, security | pytest green, web usable |
| **P4** Demo + packaging | 32–40 | Live Bob demo recorded, technical report, deploy | `demo.mp4` + `technical_report.pdf` ready |
| **P5** Buffer + submit | 40–46 | License audit, build zip, submit | `Cortex_bob-hackathon_submission.zip` uploaded |

## 8. AGILE / sync rhythm

- **Async standup every 8 hours** in `#cortex-hackathon` channel: shipped / next / blockers (3 lines max per member)
- **Sync calls** at Hour 0 (kickoff), Hour 20 (mid), Hour 32 (pre-demo freeze), Hour 40 (final review)
- **Trello** for task tracking — see [`TRELLO_BOARD.md`](TRELLO_BOARD.md)
- **PRs reviewed within 1 hour** during waking hours; same-day merges
- **Green CI required to merge to `dev`**; clean `dev` required to promote to `main`

## 9. Bob usage protocol (every member, every session)

For each Bob session you run:
1. **Before:** note current commit hash
2. **Use Bob deliberately** — clear prompt, focused task
3. **Export the task-session report** from Bob → save to `docs/bob-sessions/{member}-{nn}-{topic}.txt` (e.g. `m2-03-pytest.txt`)
4. **Append a row** to [`BOB_USAGE.md`](BOB_USAGE.md)
5. **Commit format:**
    ```
    feat: {description}

    Generated by IBM Bob (M{X}) — session #{N}
    Report: docs/bob-sessions/{file}
    Co-Authored-By: IBM Bob <bob@ibm.com>
    ```

**Reserve Bob coins for high-leverage, judge-visible work**: refactoring core logic, generating tests, secret scanning, documentation, the live demo session. Use Claude Code / Cursor for scaffolding, glue, exploratory work — see next section.

## 10. Non-Bob AI agent usage

When using Claude Code, Cursor, GitHub Copilot Chat, or any other AI coding assistant **that is not IBM Bob**, paste the starting prompt from [`AGENT_PROMPT.md`](AGENT_PROMPT.md) into the agent first. **Never log non-Bob work to `docs/BOB_USAGE.md`** — that ledger is Bob-only. The submission rules require a clear separation between Bob's contributions and other tools'.

## 11. Trello board

See [`TRELLO_BOARD.md`](TRELLO_BOARD.md) for the full structure and the initial ~50 cards. Quick summary:

- **Columns:** Backlog · This Phase · In Progress · In Review · Blocked · Done · Shipped
- **Labels:** owner (M1/M2/M3/M4) · area (bob-extension/backend/frontend/ai/telegram/docker/docs/demo) · ai-usage (bob-session/claude-code/manual) · priority (critical-path/nice-to-have)
- **Card title format:** `[area] short verb-led description` (matches PR titles)

## 12. Bob coin allocation

| Member | P1 | P2 | P3 | P4 | Total | Buffer |
|---|---|---|---|---|---|---|
| **M1** | 0 | 3 | 6 | 13 | **22** | 18 |
| **M2** | 0 | 6 | 10 | 2 | **18** | 22 |
| **M3** | 3 | 4 | 8 | 3 | **18** | 22 |
| **M4** | 0 | 6 | 8 | 3 | **17** | 23 |
| **Team** | 3 | 19 | 32 | 21 | **75** | **85** |

## 13. Risk register & cut order

If we are behind schedule, **cut features in this order** (top first):

1. Capacitor wrap (iOS/Android shells)
2. Carbon Design System (fall back to plain CSS / shadcn)
3. ⌘K command palette
4. Recall-count metric
5. Agentic auto-capture (the second innovation) — **never cut proactive recall**
6. Telegram voice (text-only fallback)
7. `/diary-timeline` slash command

**Never cut:** the 5 MCP tools · Bob mode + skill + at least one slash command · the demo video · technical report · Bob session reports · `docker compose up` working.

| Risk | Prob | Impact | Mitigation |
|---|---|---|---|
| Bob's MCP config file path/format unknown | M | H | M1 spikes Hour 0–2 |
| watsonx.ai access not provisioned | M | M | Local sentence-transformers fallback |
| sqlite-vec install issues | L | M | Vendor prebuilt; fallback to plain SQLite + Python cosine |
| Whisper too slow | M | L | watsonx STT swap |
| Newbie FE blocked | M | M | Pairing protocol; Carbon fallback to shadcn |
| Bob coin overrun | L | M | 85-coin buffer; M1 monitors |
| Demo recording fails | M | H | Draft demo by Hour 36; final by 40 |
| Docker port conflicts | L | M | port 8080 (api) and 8081 (web) configurable via env |

## 14. Definition of done (project level)

- [ ] All 5 MCP tools work end-to-end from Bob, web, and bot clients
- [ ] `docker compose up` starts the stack on port 8080 (api), 8081 (web)
- [ ] pytest suite passes
- [ ] Web UI is usable on desktop and mobile widths
- [ ] Telegram bot accepts text and voice
- [ ] Bob extension manifests are installable by judges (`cp -r bob/* ~/.bob/`)
- [ ] All Bob sessions exported to `docs/bob-sessions/`
- [ ] [`BOB_USAGE.md`](BOB_USAGE.md) ledger complete
- [ ] `technical_report.pdf` (≤4 pages, A4) written
- [ ] `demo.mp4` (≤5 min, 1080p, H.264, ≤200 MB) recorded
- [ ] `LICENSE`, `team_info.json` filled in
- [ ] License audit: all third-party deps are commercial-friendly (MIT/Apache/BSD)
- [ ] `Cortex_bob-hackathon_submission.zip` built and uploaded **before 10:00 AM ET on May 3, 2026**

---

## 15. First action per member (Hour 0)

| Member | First action | Owner of |
|---|---|---|
| **M1** | Create GitHub repo + Trello board, invite team, fill `team_info.json`, push Level 0 to `main` | Repo, Trello, Bob extensions, demo, docs |
| **M2** | Clone repo, set up Python venv, install sqlite-vec, scaffold `cortex-api/` | API, storage, retrieval, tests |
| **M3** | Clone repo, install Node 20+, scaffold `cortex-web/` with Vite + Carbon | Web UI |
| **M4** | Clone repo, register Telegram bot, get watsonx creds, scaffold `cortex-bot/` | Telegram, watsonx, transcription |

After everyone confirms env ready in Slack, M1 calls the kickoff sync (Hour 0:30) and we walk through `CONTRACTS.md` together.

**Then each member opens their first feature branch and starts Phase 1.**
