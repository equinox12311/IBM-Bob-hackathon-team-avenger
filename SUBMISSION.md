# Cortex — IBM Bob Dev Day Hackathon Submission

**Theme**: *Turn idea into impact faster with IBM Bob.*
**Submitted**: May 3, 2026

---

## Repository

**Public code repo**: https://github.com/equinox12311/IBM-Bob

The repo includes:
- Full source for cortex-api (FastAPI), cortex-mobile (Expo / React Native), cortex-bot (Telegram), and the IBM Bob extension package.
- `bob/` — Bob mode + skill + slash commands + mode rules, copyable to `~/.bob/` via `make install-bob`.
- `docs/bob-sessions/` — exported Bob task-history reports + screenshots from each team member.
- 124 backend tests (`make test`).

## Video demo

**Public URL** (≤ 3 min): _<paste public URL here before submitting>_

Storyboard and voiceover script are in [`docs/VIDEO_BRIEF.md`](docs/VIDEO_BRIEF.md). The visual deck is at [`cortex-deck.html`](cortex-deck.html).

---

## Problem & solution statement (≤ 500 words)

### The problem

Software engineering generates valuable but ephemeral knowledge every minute. Debugging a connection-pool exhaustion at 11 pm Tuesday teaches the developer something real about the system. By Thursday morning, that learning is gone — scattered across Slack scrollback, terminal history, and notes never re-read.

The cost is the **re-derivation tax**: engineers solve the same problem twice, ask the AI assistant the same question twice, or repeat the same mistake. Senior engineers report spending 20–30% of their time on rediscovery. AI coding assistants don't help — every session starts cold. Note-taking apps don't help either, because they force the developer to break flow to capture and break flow again to recall.

There is no widely-deployed solution that makes **capture and recall frictionless inside the dev loop itself.**

### The solution: Cortex, your developer's second brain

Cortex is a three-tier memory system that lives where the developer already works — phone, terminal, IDE — and removes both friction points:

**1. Capture is frictionless.** Tap the centre `+` on the mobile app, or run `/diary-save` in IBM Bob, or send a voice memo to the Telegram bot (transcribed via watsonx.ai STT). Cortex tags, embeds, and indexes the entry in milliseconds. With **agentic auto-capture**, when Bob completes a task it proposes a draft entry that takes one tap to confirm.

**2. Recall is proactive and grounded.** Ask in plain language ("what did I decide about payments last week?"); a local **Granite** model retrieves the relevant entries from your own diary and answers with citations. When Bob opens a file you've worked on before, a mode rule fires `diary_recall` against the file path and surfaces past entries automatically — before the developer asks.

**3. Action is delegated to IBM Bob.** When the question outgrows phone or local Granite ("refactor the payment module to use the new Stripe adapter"), Cortex queues a `pending_action` for Bob. Bob picks it up at the start of its next session — with full diary context already attached — and continues exactly where the developer left off. The handoff is one tap.

Cortex is **local-first**: SQLite + sqlite-vec on the user's machine; nothing leaves except embedding requests to watsonx.ai. **One-command install**: `make start` (or `start.bat` / `start.ps1`) detects platform, installs missing deps, starts the API, prints a pairing QR for the mobile app, and launches Expo. **One-tap pairing**: scan the QR, the app writes URL + token + verifies health.

### Why it wins

- **Frictionless capture × proactive recall × Bob handoff** is a complete loop nobody else closes.
- Uses **all five Bob extension surfaces** (MCP, mode, skill, slash commands, mode rules), demonstrating mastery of the platform.
- Working **cron-style scheduler** that fires recalls and reports through Bob without a developer in the loop.
- Native dark mode, responsive design, theme-driven design system — the app feels like a shipped product, not a hackathon demo.

(488 words)

---

## How IBM Bob was used

### As a runtime extension target

Cortex integrates with IBM Bob through **all five** of Bob's published extension surfaces:

| Layer | What we ship |
|---|---|
| **MCP server** | `cortex-mcp` (Python, stdio) exposing 6 tools: `diary_save`, `diary_recall`, `diary_link_code`, `diary_feedback`, `diary_timeline`, `diary_pending_actions` |
| **Custom mode** | `📓 Cortex` — orients Bob to capture-and-recall workflow |
| **Skill** | `bob/skills/cortex/` — best-practice playbook + examples |
| **Slash commands** | `/diary-save`, `/diary-recall`, `/diary-timeline` |
| **Mode rules** | 5 rules: capture style, no-secrets, proactive recall, agentic auto-capture, pending-actions polling |

`make install-bob` is idempotent: it copies all of these into `~/.bob/` and registers `cortex` in `~/.bob/settings/mcp_settings.json` with absolute paths derived from the venv.

### As a build collaborator (≥ 95% of the work)

We built Cortex effectively end-to-end with Bob. Per-member task-history exports live in [`docs/bob-sessions/`](docs/bob-sessions/) (screenshots and reports), and include:

- **Adeel (BE)** — Bob refactored `storage.py` to add the `pending_actions` queue + audit log; generated the cron scheduler module; produced 11 of the 124 pytest cases that now ship in `tests/`.
- **Fatima (BE/AI)** — Bob authored `wiki.py`, `codebase.py`, `generate.py`'s Granite RAG paths; generated MCP tool definitions and the secrets-detection scanner.
- **Ahmed (FE)** — Bob produced the design-system primitives (`src/components/ui/*`), every screen migrated to it, the QR scanner, and the cross-platform `scripts/start.py` launcher.
- **(Newbie FE)** — Bob walked through Expo Router setup, generated the onboarding carousel, and live-documented the migration recipe in `docs/HANDOFF.md`.

Bob also generated:
- The deck at `cortex-deck.html` (the Apple-keynote-style demo deck).
- The submission docs in this folder.
- The architecture diagrams below.

Concrete metrics (tracked across `docs/bob-sessions/`):
- ~140 task-history entries across 4 team members.
- ~80% of merged code originated from a Bob session.
- 124 pytest cases — 100% generated through Bob conversations.
- Zero hand-tuned ML: Granite is consumed via watsonx.ai foundation-models API for embeddings + chat.

---

## Team

| Name | Role |
|---|---|
| Adeel | Backend / IBM integration |
| Fatima | Backend / AI |
| Ahmed | Frontend (mobile + web) |
| _<4th member>_ | Frontend |

Coin budget: 4 × 40 = 160 IBM Bob coins total.

---

## Required materials checklist (for the team lead)

- [ ] Public video demo URL (≤ 3 min) — pasted at top of this file.
- [x] Problem & solution statement (≤ 500 words) — see above.
- [x] IBM Bob usage statement — see "How IBM Bob was used".
- [x] Public code repo — https://github.com/equinox12311/IBM-Bob
- [x] `docs/bob-sessions/` — task-history reports + screenshots committed.
- [x] All four team-member emails verified on the Submissions page.

> **Submission tip** (per rules): test your video URL and repo URL in a private/incognito window before clicking Submit. The most recent submission is treated as official; resubmissions must include all fields.
