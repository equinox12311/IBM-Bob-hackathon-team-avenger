# Demo recording — step-by-step

Cheat sheet for the 3-minute submission video. Follow top-to-bottom.

---

## Before you record (5 min prep)

### Pre-flight tabs / windows you'll need

- **Terminal A** — running `make start` (will stay running)
- **Terminal B** — fresh shell for `make pair` if needed
- **Bob (IDE)** — open, ready to switch to "📓 Cortex" mode
- **Phone** — Cortex app installed via Expo Go, screen recording set up

### Reset state for a clean demo

In **Terminal B** (any working dir is fine, but the repo root is clean):

```bash
cd ~/Documents/GitHub/ibm-hackathon

# 1. Stop anything stale from earlier testing
make stop 2>/dev/null
pkill -9 -f cortex_api 2>/dev/null
pkill -9 -f "expo start" 2>/dev/null
rm -f .logs/api.pid

# 2. Fresh DB + 28 seeded entries spread across 7 days
rm -f data/cortex.db
make start &        # boots API in background; Expo will fire below
sleep 5
.venv/bin/python scripts/seed.py

# 3. Index the codebase so the Explorer scene works
curl -s -X POST http://127.0.0.1:8080/api/v1/codebase/index \
  -H "Authorization: Bearer $(grep DIARY_TOKEN .env | cut -d= -f2)" \
  -H "Content-Type: application/json" \
  -d '{"path":"'"$(pwd)"'","max_files":200}' | head -c 200
echo

# 4. Pre-warm Granite (first chat takes ~10 s; warm it before recording)
curl -s -X POST http://127.0.0.1:8080/api/v1/chat \
  -H "Authorization: Bearer $(grep DIARY_TOKEN .env | cut -d= -f2)" \
  -H "Content-Type: application/json" \
  -d '{"query":"hello","k":1}' > /dev/null
echo "✓ Granite warm"
```

### Pair the phone (do this once, before recording — the on-camera pairing scene reuses the saved settings)

1. Phone: install **Expo Go** if you haven't.
2. In Expo (Terminal A), scan the **Expo QR** with your phone's Camera (iOS) or Expo Go (Android). The Cortex app loads.
3. In the app: **Settings → Scan to connect** (or paste manually):
   - URL: `http://192.168.1.213:8080`
   - Token: from `.env` `DIARY_TOKEN=…`
4. Confirm green "Connected · v0.2.0" banner.
5. Force-quit and reopen the app — make sure pairing persisted.

### Final checks before recording

- [ ] Today screen shows "API connected" pill (green)
- [ ] Notification bell shows a small badge (pending actions)
- [ ] Recent section has ~5 entries
- [ ] Quiet your terminal (clear scrollback, large font)
- [ ] Record at 1080p+ portrait if going Reels/TikTok, landscape if Apple-style horizontal

---

## The 3-minute recording (180 s)

Roughly mirrors `cortex-deck.html`. Voiceover script is in `docs/VIDEO_BRIEF.md` §5.

### Scene 1 · Cold open · 0:00 – 0:08

**Visual**: Cortex app on phone, Today screen.

**VO**: *"Every line of code you write leaves a trail."*

**Action**: Linger on Today for 2 s, slow scroll up showing the hero, stat tiles, first 2 entries.

### Scene 2 · The problem · 0:08 – 0:30

**Visual**: switch to a code editor / Bob with messy unsaved scratch notes; cut to Today again.

**VO**: *"Most of what a developer knows never reaches the codebase. Until now."*

### Scene 3 · Wordmark + three tiers · 0:30 – 0:50

**Visual**: Open `cortex-deck.html` slides 4–6 fullscreen, advance with → key. Or screen-cap the deck slides as static frames.

**VO**: *"Welcome to Cortex. Memory · Reasoning · Action. A fast local diary, IBM Granite for reasoning, IBM Bob for the work."*

### Scene 4 · Capture · 0:50 – 1:10

**Visual**: Phone, tap centre **+ FAB**.
1. Tap kind chip **Decision**.
2. Type *"Switch payment provider to Stripe — Adyen latency too high"*.
3. Tags: `payments, stripe`.
4. Tap **Auto** (auto-tag fires; granite suggests `latency`, `eu-region`).
5. Tap **Save entry**. Returns to Today; new entry appears in **Recent**.

**VO**: *"Drop a thought from your phone, your terminal, or Telegram. Cortex tags, embeds, and indexes it the moment it lands."*

### Scene 5 · Recall · 1:10 – 1:30

**Visual**: Phone, tap **Ask** tab (sparkles).
1. Type *"What did I decide about payments last week?"*
2. Wait for streamed answer; the response cites `[#1]` or similar.
3. Tap the citation chip — entry detail opens. Back.

**VO**: *"Ask a question the way you'd ask a teammate. Granite answers from your own diary — and shows you exactly where it came from."*

### Scene 6 · Hand-off to Bob · 1:30 – 2:00

**Visual**: Phone, tap **More → Workspace**.
1. Type *"Refactor the payment module to use the new Stripe adapter."* → send.
2. Granite responds with related entries.
3. **Tap "Send to Bob"** on your message — chip flips to "Sent to Bob" (green check).

Cut to **Bob (IDE)**:
4. Open Bob, switch to **📓 Cortex** mode.
5. New session; Bob calls `diary_pending_actions` (rule 05 fires automatically).
6. Bob's first reply mentions the queued task.

**VO**: *"When the work outgrows the phone, Cortex queues it for IBM Bob. Bob picks it up at the start of its next session — with full diary context already in hand."*

### Scene 7 · Skill Creator · 2:00 – 2:20

**Visual**: Phone, **More → Skills**.
1. Tap **+ New skill**.
2. Slug `weekly-summary`, description ≥30 chars, body any markdown.
3. Tap **Create skill** — alert: "Run `make install-bob`…".
4. Show the row appearing in the list.

Cut to **Terminal**:
5. `make install-bob` — show the skill copying to `~/.bob/skills/weekly-summary/`.

**VO**: *"Need a custom workflow? Define a Bob skill from your phone. One command later, it lives in Bob's library."*

### Scene 8 · The system · 2:20 – 2:45

Quick montage. Each panel ~5 s, smooth horizontal whip-pan.

1. **Scheduler** — More → Scheduler. Show the cron list with `0 9 * * *` morning recall. Tap **Run all due now** → toast.
2. **Codebase Explorer** — More → Codebase. Show 199 files indexed. Tap a Python file. Type *"What does this file do?"* → Granite answers with `L1-L168` citation.
3. **Wiki** — More → Wiki. Tap **Generate**, topic "authentication architecture". Wait ~5 s. Page opens.
4. **Security** — More → Security. Show the bar chart with `skill.create / .update / .delete` events from the past hour.

**VO**: *"Schedule daily recalls. Index your codebase for Granite. Let Cortex write your wiki from the diary itself. Every change tracked, every action logged."*

### Scene 9 · Closing · 2:45 – 3:00

**Visual**: Cut to dark. Show `cortex-deck.html` slide 18 (closing wordmark) → slide 19 (tagline) → slide 20 (CTA `make start`).

**VO**: *"Cortex. Built on IBM Bob and Granite. Your developer's second brain."*

---

## Tips that save you re-takes

- **Pre-warm Granite** before recording (the prep block above does this). The first chat takes 5–10 s; subsequent are <2 s.
- **Don't re-pair on camera** if you've practiced the scan. Pre-pair, force-quit, reopen — the connection persists. Only show the pairing scene if you've rehearsed it.
- **Have a fallback for Bob** — if Bob's UI hiccups, you can show `cat ~/.bob/skills/cortex/SKILL.md` + the queued action in `curl /api/v1/actions/all` as proof.
- **Lock orientation** — phone in portrait for vertical, simulator in landscape if going horizontal.
- **Disable notifications** on Mac and phone before recording.
- **Light or dark?** — pick one and stick with it through the recording. The mid-demo theme toggle reads as a feature, not a bug, but only if you do it on purpose at one specific beat.

---

## Post-recording

1. Edit, target 2:55–3:00 (judges cut off at 3:00).
2. Upload to YouTube unlisted, Vimeo, or Loom. Make sure the URL works in **incognito**.
3. Paste the URL into `SUBMISSION.md` under "Public URL".
4. Re-run `make smoke` to confirm nothing in the repo regressed during recording prep.
5. Verify `docs/bob-sessions/` has each member's task-history exports + screenshots.
6. Team lead opens the submission form on the IBM Bob platform and pastes:
   - Repo URL: `https://github.com/equinox12311/IBM-Bob`
   - Video URL
   - Problem & solution: copy from `SUBMISSION.md` (≤500 words)
   - Bob usage: copy from `SUBMISSION.md` "How IBM Bob was used"
7. Confirmation email to all four members.

---

## If something breaks mid-recording

| Symptom | Fix |
|---|---|
| API not responding | `curl http://127.0.0.1:8080/health` — if dead, `make stop && make start` |
| Phone shows "Offline" | Settings → Scan to connect, re-pair |
| Granite hangs on first chat | You forgot the warm-up. Skip to next scene. |
| Triangle icons | Force-quit Expo Go and re-open. Fonts didn't load on cold launch. |
| Dark mode looks broken | Ignore — flip back to light, mention it in voiceover later |
| Bob session fresh | Type one message in Bob first; the rule fires on session start |
| Expo crashes | `r` to reload, or Ctrl-C and re-run `npx expo start --clear` |

---

*This file lives at `docs/DEMO_RECORDING.md`. Print it. Tape it next to your monitor.*
