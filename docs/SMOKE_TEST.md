# Cortex — Mobile smoke-test checklist (Tier 2)

A printable list to run with the mobile app on a real phone before a demo or submission. Tier 1 (`make smoke`) covers the backend; this doc covers everything a human has to eyeball.

**Time**: ~10 minutes if everything works · 20–30 if you find regressions.

**Prep**: `make start` running on your Mac. Phone with **Expo Go** installed and on the **same Wi-Fi**.

---

## A. Boot & pair · 2 min

- [ ] **A1** — `make start` printed two QRs: the **pairing QR** (above the Expo line) and the **Expo QR** (below it).
- [ ] **A2** — Phone scanned the **Expo QR** with Camera (iOS) or Expo Go (Android). The app loaded into Cortex.
- [ ] **A3** — On first launch, the **3-card onboarding** appears (Memory · Reasoning · Action). Skip works. Get-started reaches the Today screen.
- [ ] **A4** — Today screen renders without "upside-down triangle" icons. The hero card says `cortex · <today's date>` in mono caps and `Memory · Reasoning · Action.` underneath.
- [ ] **A5** — Top-right pill shows **Offline** (because we haven't paired yet). No red error toast about Ollama.
- [ ] **A6** — Tap **Settings** (More tab → Settings, or the "Connect cortex-api" button on Today). The first card says **Scan to connect**. Tap it.
- [ ] **A7** — Camera permission prompt → Allow. Camera opens with a centred reticle.
- [ ] **A8** — Aim phone at the **pairing QR** in the terminal. Within ~1 s the modal closes; an inline banner reads `Connected · v0.x.x`.
- [ ] **A9** — Today's pill now reads **API connected** (green). No Ollama error appears.

## B. Theme · 1 min

- [ ] **B1** — Settings → Appearance → tap **Dark**. Status bar style flips. Today, Search, Ask, More all use the dark surface (`#11131c`).
- [ ] **B2** — Tap **Light**. Everything flips back.
- [ ] **B3** — Tap **Auto**. Resolved scheme matches the OS-level light/dark setting.
- [ ] **B4** — Open **Settings → About**: lowercase `cortex` wordmark, tagline "your developer's second brain.", version, "IBM Bob · Granite" footer line.

## C. Capture flow · 2 min

- [ ] **C1** — On Today, tap the centre **+ FAB** (blue, hangs above the tab bar).
- [ ] **C2** — Capture screen: kind chips along the top (Note, Idea, Bug, Fix, Decision, Insight, Snippet, Task). Tap **Decision**.
- [ ] **C3** — Type something memorable, e.g. *"Switch payment provider to Stripe — Adyen latency too high"*. Tags: `payments, stripe`.
- [ ] **C4** — Tap **Auto** (the sparkles button) — auto-tag suggests 2–4 tags from the body.
- [ ] **C5** — Tap **Save entry**. Returns to Today. The new entry appears in the **Recent** section with the right kind icon and `just now`.
- [ ] **C6** — Today stat tiles updated (Entries +1).

## D. Recall flow · 2 min

- [ ] **D1** — Tap **Ask** tab (sparkles icon). Empty state headline is **Recall by intent.**
- [ ] **D2** — Status pill is **Granite RAG** (green) since the API is connected.
- [ ] **D3** — Type the question: *"What did I decide about payments?"* — send.
- [ ] **D4** — Granite streams an answer that references your decision entry. Footer line lists `— citations: #<id>`.
- [ ] **D5** — Tap a quick-prompt chip (e.g. "Summarise my recent work") → another answer arrives.
- [ ] **D6** — Tap the **trash** icon in the header → confirm Clear → conversation empties.

## E. Search · 1 min

- [ ] **E1** — Tap **Search** tab. Three mode chips: Granite / Semantic / Keyword. Default is Granite when API is on.
- [ ] **E2** — Search `payment` — results include the Decision from C3. Cards show kind pill + score.
- [ ] **E3** — Tap the result → entry detail loads. Back button returns.

## F. Skill creator (Bob skill from your phone) · 2 min

- [ ] **F1** — More → **Skills**. List shows at least the reserved `cortex` skill with a **read-only** lock pill.
- [ ] **F2** — Tap **+ New skill**. Modal opens.
- [ ] **F3** — Slug: `weekly-summary`. Description (≥30 chars): *"Generate a weekly summary of what I worked on, grouped by repo."*. Body: any markdown text. Tap **Create skill**.
- [ ] **F4** — Alert appears: *"Run `make install-bob` to deploy this skill to ~/.bob/skills/."*. New row appears in the list.
- [ ] **F5** — Tap **Edit** on `weekly-summary` → change description → Save → list updates.
- [ ] **F6** — Tap **Delete** on `weekly-summary` → confirm → row disappears.
- [ ] **F7** — Tap **Edit** on `cortex` → fields are read-only, no Save button. Close.

## G. Security audit (sees activity from F) · 1 min

- [ ] **G1** — More → **Security**. Window toggle shows **24h** by default. Hero stat shows **Events · LAST 24h** with a count ≥ 3 (you just ran 3 skill ops in F).
- [ ] **G2** — Bar chart shows `skill.create`, `skill.update`, `skill.delete` rows tinted blue / orange / red.
- [ ] **G3** — **RECENT EVENTS** list shows the actual rows with `actor` + `target` + `relTime`.
- [ ] **G4** — Toggle window to **1h** → counts go down or stay same. **7d** → equal or higher.
- [ ] **G5** — Pull to refresh — list updates without crash.

## H. Cron scheduler · 2 min

- [ ] **H1** — More → **Scheduler**. Empty state with `automate.` headline.
- [ ] **H2** — Tap **+** in header. New-automation modal opens.
- [ ] **H3** — Pick trigger **notify**. Name `smoke-test`. Action `ping`. Schedule preset chip **Every 5 min** (`*/5 * * * *`). Tap **Create**.
- [ ] **H4** — Modal closes. List shows the new automation, enabled toggle on, schedule and trigger kind in mono caps.
- [ ] **H5** — Tap **Run now** → alert: *"Status: notified"*.
- [ ] **H6** — Card meta updates: `1 runs · last just now`.
- [ ] **H7** — Tap hero **Run all due now** → alert with count of fires.
- [ ] **H8** — Toggle the automation off → fade. Toggle back on. **Delete** → confirm → row gone.
- [ ] **H9** — Try creating with an **invalid cron** (e.g. `not cron`) → the API returns 400 and the form stays open with an alert.

## I. Send-to-Bob (the killer beat) · 2 min

- [ ] **I1** — More → **Workspace**. Hero card reads `from phone to bob.`
- [ ] **I2** — Type *"Refactor the payment module to use the new Stripe adapter."* → send.
- [ ] **I3** — Granite responds with related entries from your diary (the Decision from C3 should match).
- [ ] **I4** — Tap **Send to Bob** on your message bubble → the chip turns into **Sent to Bob** (green check).
- [ ] **I5** — On your Mac, in a separate terminal: `curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/actions/all` → JSON shows the queued `free` action with the prompt text.

## J. Codebase explorer + Wiki · 2 min

- [ ] **J1** — More → **Codebase**. EmptyState says `analyze.` Tap **Index now** → confirm path → progress bar.
- [ ] **J2** — File list populates after a few seconds. Each row shows kind pill (src / test / config / doc), file path (mono), line count.
- [ ] **J3** — Tap a Python file. Detail panel slides up. Type *"What does this file do?"* → tap sparkles → Granite answers with citations like `#42`.
- [ ] **J4** — More → **Wiki**. Hero card `document.` Generate → topic *"authentication architecture"* → wait → page opens in a modal with body text.
- [ ] **J5** — Close modal. The list now shows the new page with relTime stamp.

## K. Edge cases · 2 min

- [ ] **K1** — Settings → enter a **wrong token** → tap **Save & test connection** → red banner *Could not connect*.
- [ ] **K2** — Restore the right token (or rescan QR) → green *Connected · vX*.
- [ ] **K3** — Turn off Wi-Fi briefly. Today screen still loads (local DB / demo fallback). Pill shows **Offline**.
- [ ] **K4** — Restore Wi-Fi → API pill flips back to green within ~30s.
- [ ] **K5** — Force-quit the app and relaunch → onboarding does **not** show again. Settings persist.

## L. Bob integration (manual, off-device) · 5 min

These run on your Mac, not the phone. Required if you're showing the Bob handoff in the demo.

- [ ] **L1** — `make install-bob` ran cleanly. `~/.bob/skills/cortex/SKILL.md`, `~/.bob/rules-cortex/05-pending-actions.md`, `~/.bob/commands/diary-save.md`, `~/.bob/settings/mcp_settings.json` all exist.
- [ ] **L2** — Open IBM Bob → switch to mode **📓 Cortex**. The mode loads without errors.
- [ ] **L3** — In a fresh Bob conversation, run `/diary-save Test from Bob`. The MCP server returns success. Refresh Cortex Today → entry shows up.
- [ ] **L4** — Run `/diary-recall payments` → Bob replies citing the Decision entry from C3.
- [ ] **L5** — Run the action queued in **I4** (close your Bob session, start a new one). At session start Bob calls `diary_pending_actions` (rule `05-pending-actions.md`). The queued prompt becomes Bob's first turn.

## Sign-off

If A–K all green and L1–L4 green, you're demo-ready. L5 is the most-impressive item to show on stage — it's also the most fragile, so test it twice.

```
Tester:   ____________________
Date:     ____________________
Build:    git rev-parse --short HEAD = ____________
Phone:    ____________________
Result:   [ ] ALL GREEN     [ ] FAILURES — see notes below
```

Notes:

```
.
.
.
```
