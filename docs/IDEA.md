# 📓 Cortex — A developer's second brain, native to IBM Bob

> Built for IBM Bob Dev Day · May 1–3, 2026 · 4 people · 46 hours

## The problem
Developers lose 80% of what they figure out, between sessions. Debug discoveries, "why we picked X" decisions, and "tried this didn't work" learnings vanish into Slack scrollback or notes you'll never re-read. AI coding assistants don't remember either; every session starts cold.

## What we're building
A persistent **developer journal** that lives inside IBM Bob:

- **Captures** from Bob (in-IDE), Telegram (voice/text on mobile), and a web UI
- **Recalls semantically** — ask "what did I learn about Postgres pooling?" and get the entry back with `file:line` citations
- **Proactive surfacing** — when Bob opens a file, related past entries appear *before the developer asks*
- **Agentic auto-capture** — Bob proposes draft entries on task completion; one-click confirm
- **Evolves** — 👍 boosts good entries, 👎 flags wrong ones, recency decays older notes
- **Runs locally** — no developer knowledge leaves the machine

The MCP server is the brain; Bob, Telegram, and the web UI are clients.

## Why this wins
- ✅ Hits the rubric: accelerates dev work · Bob reads repo context · automates capture/recall
- ✅ Uses *all five* of Bob's extension layers (MCP + custom mode + skill + slash commands + mode rules)
- ✅ Bob substantively used while building → **4 task-session reports** (one per IBM ID) + live Bob in the demo video
- ✅ Bonus IBM tech: **watsonx.ai** for embeddings (Granite) and STT

## Features

### Capture
- ✍️ `/diary-save` in Bob · 📱 Telegram voice/text · 💻 web quick-add · 🤖 agentic auto-capture on Bob task completion

### Recall
- 🔍 Semantic search (Bob + web) · 🎯 `/diary-recall <topic>` · 📜 timeline view · ⚡ proactive surfacing on file-open

### Learning
- 👍 boost · 👎 flag · ⏳ recency decay · 📊 recall-count badge

### Bob-native polish
- 📓 Custom mode "Cortex" · 📚 skill playbook · ⚡ 3 slash commands · 📋 mode rules · 🔒 secret detection

## Tech (boring on purpose)
Python + FastAPI + MCP SDK + SQLite + sqlite-vec · watsonx.ai · Telegram + watsonx STT · React + Vite + Carbon Design System · Docker

## Team
- **M1 — Bob/DX Lead** (Ahmed) — Bob extensions, demo video, README, technical report, live demo session
- **M2 — Backend** (TBD) — Python MCP server, storage, retrieval, tests
- **M3 — Frontend** (TBD) — React UI with Carbon Design — pairs during integration
- **M4 — Integrations** (TBD) — Telegram bot, transcription, watsonx.ai

## Timeline
| When | Goal |
|---|---|
| Hour 0–2 | Kickoff + contracts + envs |
| Hour 2–8 | Skeletons (parallel, all PRs to `dev`) |
| Hour 8–20 | Vertical slice working (`v0.1-vertical-slice`) |
| Hour 20–32 | Feature complete |
| Hour 32–40 | Demo + technical report + deploy |
| Hour 40–46 | Buffer + submit Sun 10:00 ET (15:00 BST) |

## Cut (don't ask)
Slack/WhatsApp/email · Native iOS/Android (only optional Capacitor wrap) · Real auth · True RL fine-tuning · Browser/phone OS integration · Pico-CLAW (v2 future)

## Kickoff call agenda (30 min)
1. Confirm M2, M3, M4 names + GitHub handles
2. Walk through `docs/CONTRACTS.md` together
3. Env setup checklist (Python venv / Node 20 / Bob / Telegram bot / watsonx)
4. M1 spikes Bob's MCP config path
5. Open the Trello board, claim Phase 0 cards
6. Go.
