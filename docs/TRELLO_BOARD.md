# Trello Board — Cortex / IBM Bob Hackathon

> This document defines the Trello board structure and seeds the initial card list. M1 sets up the board in Phase 0; the team copy-pastes the initial cards.

## Board name
`Cortex – IBM Bob Hackathon`

## Columns (left to right)

| Column | Purpose |
|---|---|
| **Backlog** | All future-phase tasks |
| **This Phase** | Tasks for the current phase only |
| **In Progress** | Actively being worked (one card max per member at any time) |
| **In Review** | PR open, awaiting review |
| **Blocked** | Stuck — comment must explain why |
| **Done** | Merged to `dev` |
| **Shipped** | Merged to `main` and verified working |

## Labels (apply ≥1 of each group to every card)

| Group | Labels |
|---|---|
| **Owner** | M1 · M2 · M3 · M4 |
| **Area** | bob-extension · backend · frontend · ai-integration · telegram · docker · docs · demo · devops |
| **AI usage** | bob-session · claude-code · manual |
| **Priority** | critical-path · nice-to-have · polish |

## Card template

```
Title: [area] short verb-led description

DESCRIPTION
- Acceptance criteria:
  • ...
  • ...
- Files touched: <paths>
- Branch: feat/<name>
- Estimate: 15m / 30m / 1h / 2h / 4h+
- Bob coins (if applicable): N

LINKS
- PR: <url>
- Bob session report: docs/bob-sessions/<file> (if Bob was used)
```

---

## Initial card list (~50 cards) — copy these into Trello

### Phase 0 (Hour 0–2) · Setup

- `[setup] M1 creates GitHub repo, invites team` — **M1**, manual, critical-path, 30m
- `[setup] M1 creates Trello board, invites team` — **M1**, manual, critical-path, 15m
- `[setup] All members clone repo + verify env` — **All**, manual, critical-path, 30m
- `[setup] M1 spike Bob MCP config file path/format` — **M1**, manual, critical-path, 1h
- `[setup] M2 Python venv + sqlite-vec install` — **M2**, claude-code, critical-path, 1h
- `[setup] M3 Vite + Carbon scaffold` — **M3**, claude-code, critical-path, 1h
- `[setup] M4 Telegram bot token + watsonx creds` — **M4**, claude-code, critical-path, 1h
- `[setup] M1 fills team_info.json + LICENSE` — **M1**, manual, critical-path, 15m

### Phase 1 (Hour 2–8) · Skeletons (parallel, no integration)

- `[backend] FastAPI skeleton + /entries POST stub` — **M2**, claude-code, critical-path, 1h
- `[backend] SQLite + sqlite-vec init` — **M2**, claude-code, critical-path, 1h
- `[backend] GET /search returning trivial data` — **M2**, claude-code, critical-path, 30m
- `[bob-extension] custom_modes.yaml skeleton (Cortex mode)` — **M1**, manual, critical-path, 30m
- `[bob-extension] commands/diary-save.md` — **M1**, manual, critical-path, 15m
- `[bob-extension] skills/cortex/SKILL.md v0` — **M1**, manual, critical-path, 30m
- `[frontend] Mock login screen` — **M3**, claude-code, critical-path, 1h
- `[frontend] App layout shell + nav (Carbon)` — **M3**, bob-session, critical-path, 1.5h, **3 coins**
- `[frontend] Timeline page with mock data` — **M3**, claude-code, critical-path, 1h
- `[telegram] Bot skeleton echoes text` — **M4**, claude-code, critical-path, 1h
- `[docker] docker-compose.yml wiring 3 services` — **M2**, claude-code, critical-path, 1h
- `[docker] cortex-api Dockerfile` — **M2**, claude-code, critical-path, 30m
- `[docker] cortex-web Dockerfile (nginx-served Vite build)` — **M3**, claude-code, critical-path, 30m
- `[docker] cortex-bot Dockerfile` — **M4**, claude-code, critical-path, 30m

### Phase 2 (Hour 8–20) · Vertical slice

- `[backend] Real POST /entries (persist + embed)` — **M2**, claude-code, critical-path, 2h
- `[backend] Real GET /search (vec search)` — **M2**, bob-session, critical-path, 3h, **6 coins**
- `[backend] MCP transport (stdio)` — **M2**, claude-code, critical-path, 2h
- `[bob-extension] Wire MCP server in Bob settings` — **M1**, manual, critical-path, 1h
- `[bob-extension] Test diary_save end-to-end from Bob` — **M1**, bob-session, critical-path, 1h, **3 coins**
- `[frontend] Timeline hits real API` — **M3**, bob-session, critical-path, 2h, **4 coins**
- `[frontend] Bearer token auth header` — **M3**, claude-code, critical-path, 1h
- `[telegram] Text → POST /entries` — **M4**, claude-code, critical-path, 2h
- `[telegram] Voice → Whisper → POST /entries` — **M4**, bob-session, critical-path, 4h, **6 coins**

### Phase 3 (Hour 20–32) · Feature complete

- `[bob-extension] /diary-recall slash command` — **M1**, manual, critical-path, 30m
- `[bob-extension] /diary-timeline slash command` — **M1**, manual, nice-to-have, 30m
- `[bob-extension] rules-cortex/01-capture-style.md` — **M1**, bob-session, critical-path, 1h, **3 coins**
- `[bob-extension] SKILL.md final (Bob-generated)` — **M1**, bob-session, critical-path, 1h, **3 coins**
- `[bob-extension] Proactive recall mode rule [INNOVATION]` — **M1**, bob-session, critical-path, 4h, **5 coins**
- `[bob-extension] Agentic auto-capture skill [INNOVATION]` — **M1+M4**, bob-session, critical-path, 6h, **6 coins**
- `[backend] diary_link_code, diary_feedback, diary_timeline` — **M2**, claude-code, critical-path, 3h
- `[backend] Re-ranking math (score × recency × cosine)` — **M2**, claude-code, critical-path, 1h
- `[backend] pytest suite (Bob-generated)` — **M2**, bob-session, critical-path, 4h, **6 coins**
- `[backend] Security/secret scan (Bob)` — **M2**, bob-session, critical-path, 1h, **2 coins**
- `[ai-integration] Switch embeddings to watsonx.ai` — **M4**, manual, critical-path, 2h
- `[ai-integration] watsonx STT swap (replace Whisper)` — **M4**, claude-code, critical-path, 2h
- `[ai-integration] Secret-detection middleware` — **M4**, bob-session, critical-path, 2h, **4 coins**
- `[ai-integration] Refactor + integration tests` — **M4**, bob-session, critical-path, 2h, **4 coins**
- `[frontend] Search page` — **M3**, bob-session, critical-path, 2h, **3 coins**
- `[frontend] Entry detail with citations + feedback` — **M3**, claude-code, critical-path, 3h
- `[frontend] Settings page` — **M3**, claude-code, critical-path, 1.5h
- `[frontend] Recall-count badge` — **M3**, claude-code, nice-to-have, 1h
- `[frontend] ⌘K command palette` — **M3**, bob-session, nice-to-have, 2h, **5 coins**
- `[frontend] a11y scan + UI tests` — **M3**, claude-code, nice-to-have, 1h
- `[telegram] /recall + /timeline commands` — **M4**, claude-code, critical-path, 1.5h

### Phase 4 (Hour 32–40) · Demo + packaging

- `[demo] Live Bob demo session (recording)` — **M1**, bob-session, critical-path, 3h, **10 coins**
- `[demo] demo.mp4 editing (≤5 min, 1080p, H.264)` — **M1**, manual, critical-path, 3h
- `[docs] technical_report.pdf (≤4 pages, A4)` — **M1**, claude-code, critical-path, 3h
- `[docs] README final + Bob usage statement` — **M1**, bob-session, critical-path, 2h, **3 coins**
- `[devops] Deploy web UI to Vercel` — **M3**, manual, critical-path, 1h
- `[devops] Capacitor wrap (optional)` — **M1**, claude-code, nice-to-have, 3h
- `[demo] iPhone Telegram demo recording` — **M4**, manual, critical-path, 1h
- `[bob-export] M2 exports all session reports` — **M2**, manual, critical-path, 30m
- `[bob-export] M3 exports all session reports` — **M3**, manual, critical-path, 30m
- `[bob-export] M4 exports all session reports` — **M4**, manual, critical-path, 30m

### Phase 5 (Hour 40–46) · Buffer + submit

- `[devops] License audit (all deps MIT/Apache/BSD)` — **M1**, claude-code, critical-path, 1h
- `[submit] Final QA pass (docker compose up green)` — **All**, manual, critical-path, 1h
- `[submit] Build Cortex_bob-hackathon_submission.zip` — **M1**, manual, critical-path, 30m
- `[submit] Submit via official form` — **M1**, manual, critical-path, 30m

---

## Conventions

- Move cards across columns yourself; don't ask M1 for permission.
- One card "In Progress" per member at a time. Finish or move to "Blocked" before starting another.
- Comment when you switch a card to "Blocked" — say what's blocking.
- Update card description when scope shifts (don't silently rewrite).
- "Done" = merged to `dev`. "Shipped" = merged to `main` (M1 promotes at end of each phase).
