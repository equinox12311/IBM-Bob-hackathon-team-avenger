# Cortex — 3-Minute Demo Video Brief

A spec a design LLM (Claude, Midjourney, Veo, Runway, Sora — anything) can execute on. Treat it like a directorial shot list: every scene has a timecode, a visual, on-screen text, and the voiceover line that plays under it.

> **Tone reference**: an Apple keynote reveal. Calm, deliberate, declarative. No exclamation marks. The product does the talking. Music is a slow-build cinematic piano + soft synth pad — under -18 LUFS so the voiceover sits on top.

---

## 1. Brand DNA — non-negotiables

The video must look like the product. Use these tokens for every slide.

| | |
|---|---|
| **Display font** | Plus Jakarta Sans (700 / 600 / 400) |
| **Mono / accent font** | Space Grotesk (400) — for code snippets and timestamps |
| **Primary** | `#004cca` (deep IBM blue) |
| **Secondary** | `#731be5` (electric purple) |
| **Tertiary** | `#8e4000` (warm rust) — used sparingly, accent only |
| **Surface (light)** | `#f9f9fe` near-white background |
| **Surface (dark)** | `#11131c` for the hero / closing reveal |
| **On-surface text** | `#1a1c1f` light · `#e1e1ee` dark |
| **Outline / dividers** | `#c2c6d9` |
| **Soft tints** | `#dbe1ff` (primary-fixed) · `#ebdcff` (secondary-fixed) · `#ffdbc9` (tertiary-fixed) |
| **Card radius** | 32 px |
| **Chip / pill radius** | 100 px (full) |
| **Card shadow** | 0 8px 30px rgba(0,0,0,.04) — feather-soft |
| **Grid** | 8-pt baseline; 24-pt gutters |
| **Aspect** | 1920×1080 (16:9). Mobile mockups inside a clean dark device frame, screen ~1080×2340. |
| **Motion** | 24 fps. Ease-out cubic, 400–600 ms. No bounces. |

**One-line product positioning** (drop this in the deck if needed): *Cortex is your developer's second brain — built on IBM Bob and Granite.*

---

## 2. Story arc

A 3-minute video splits cleanly into 6 acts. Total target: **180 s**.

| # | Beat | Duration | Purpose |
|---|---|---|---|
| 1 | Cold open / hero | 0:00 – 0:15 | Brand reveal. Get attention. |
| 2 | The problem | 0:15 – 0:30 | "Developers lose context constantly." Tension. |
| 3 | Meet Cortex | 0:30 – 0:50 | Product reveal. The three-tier model. |
| 4 | Capture & recall | 0:50 – 1:30 | Daily-use proof. |
| 5 | Bob hand-off | 1:30 – 2:20 | The killer differentiator. IBM angle. |
| 6 | The system around it | 2:20 – 2:50 | Skills, automations, security — show range. |
| 7 | Close & tagline | 2:50 – 3:00 | Logo. Built on IBM. Out. |

---

## 3. Scene-by-scene shot list

Each scene has: **(V)** visual, **(T)** on-screen typography, **(VO)** voiceover line, **(SFX)** optional ambience.

> **Voiceover voice direction**: calm male or female, low-mid register, measured pace (~140 wpm), warm but precise. ElevenLabs "Adam" or "Charlotte" both work. No upspeak.

---

### Scene 1 — Cold open · `0:00 – 0:08`

- **(V)** Pure black frame. A single soft blue dot pulses at center. On the second pulse the dot expands into a soft halo and the **Cortex** wordmark fades in (Plus Jakarta Sans, 96 pt, weight 700, color `#f9f9fe`). One subtle horizontal scanline of `#004cca` glides through and dissipates.
- **(T)** `cortex` — lowercase, centered.
- **(VO)** *"Every line of code you write… leaves a trail."*
- **(SFX)** Single low piano note, with reverb tail.

### Scene 2 — Cold open continued · `0:08 – 0:15`

- **(V)** Cut to a developer's editor in the dark mode palette: a wall of code scrolls past too fast to read. Subtle vignette. Three small floating notes (sticky-note style, `#dbe1ff` / `#ebdcff` / `#ffdbc9`) drift up off the screen and dissolve.
- **(T)** None.
- **(VO)** *"Decisions. Bugs. Insights. They live in your head — until they don't."*

### Scene 3 — The problem · `0:15 – 0:30`

- **(V)** Split-screen montage. Left: hands typing on a laptop. Right: a phone lock-screen lighting up with a thought (single line of text on `#11131c`, mono, glowing softly). Cut to a developer rubbing their temples in front of a monitor. Slight desaturation.
- **(T)** Three short statements appear and dissolve, one per second, top-aligned, 32 pt, weight 600:
  - `"Wait — what did I decide last sprint?"`
  - `"Where did I put that fix?"`
  - `"Why did past-me write this?"`
- **(VO)** *"Most of what you know never makes it into the codebase. It's lost between commits, between meetings, between days. Until now."*

### Scene 4 — Logo reveal · `0:30 – 0:38`

- **(V)** Hard cut to clean `#f9f9fe` background. The Cortex wordmark reassembles in primary blue `#004cca`, larger this time (160 pt), centered. Beneath it, a thin horizontal hairline (`#c2c6d9`, 1 px), and below the line: `your developer's second brain` in 24 pt `#424656`.
- **(T)**
  ```
  cortex
  ─────────────────
  your developer's second brain
  ```
- **(VO)** *"Welcome to Cortex. Your developer's second brain."*

### Scene 5 — The three-tier model · `0:38 – 0:50`

- **(V)** Three vertical cards slide up from the bottom in sequence (200 ms apart). Each card: 32 px radius, soft shadow, white surface, top accent dot, and an icon.
  - Card 1: blue dot · `Diary` · "Captures every thought, decision, and snippet."
  - Card 2: purple dot · `Granite` · "Reasons over your own context. Locally."
  - Card 3: rust dot · `IBM Bob` · "Steps in when you need full intelligence."
- **(T)** Headline above the row, 36 pt 700: `Three tiers of memory.`
- **(VO)** *"Cortex pairs a fast local diary with IBM Granite for reasoning, and IBM Bob for the heavy lifting. Together, they remember what you can't."*

### Scene 6 — Capture, on phone · `0:50 – 1:10`

- **(V)** A single iPhone-style mockup, centered, dark device chrome. The screen shows the Cortex **Capture** flow:
  1. User taps `+ Capture` on the Today screen.
  2. Quick-action chips appear (`Log a Fix`, `Save Decision`, `Quick Note`, `Capture Idea`).
  3. They tap *Save Decision*, type "Switch payment provider to Stripe — Adyen latency too high", and hit save.
  4. A toast slides in: `Saved · indexed in 240 ms`.
- **(T)** Caption pinned to the right of the device, top-aligned: `Capture without breaking flow.` 28 pt 600.
- **(VO)** *"Drop a thought from your phone, your terminal, or Telegram. Cortex tags, embeds, and indexes it the moment it lands. No friction. No filing system."*
- **(SFX)** Soft tick on tap; gentle pop on save.

### Scene 7 — Recall, on phone · `1:10 – 1:30`

- **(V)** Same device, swipe over to the AI Chat tab. User types: `"What did I decide about payments last week?"`. A message bubble streams in (typing indicator first, then word-by-word) with the answer and a citation chip showing `[entry 482]`. They tap the citation; it expands to show the original Stripe note.
- **(T)** Right-side caption: `Recall by intent.` 28 pt 600. Subline 18 pt 400: `Granite reasons over your own diary, with citations.`
- **(VO)** *"Ask a question the way you'd ask a teammate. Granite answers from your own diary — and shows you exactly where it came from."*

### Scene 8 — Bob hand-off · `1:30 – 2:00`

- **(V)** Same chat, now the user types: `"Refactor the payment module to use the new Stripe adapter"`. Cortex responds with a soft purple banner: `This is a job for Bob. Queueing it.` A subtle pulse animates from the phone outward; cross-fade to a desktop scene where IBM Bob's IDE sidebar is visible. A new pending action appears in Bob's queue (`recall: Refactor the payment module…`). Bob picks it up; we see file edits begin to stream into the editor.
- **(T)** Banner caption: `Cortex hands off to IBM Bob.` 28 pt 600.
  Below, mono-font line: `pending_actions → IBM Bob session`
- **(VO)** *"When the question outgrows the phone, Cortex queues it for IBM Bob. Bob picks it up at the start of its next session — with full diary context already in hand. The conversation continues, exactly where you left off."*

### Scene 9 — Skill Creator · `2:00 – 2:20`

- **(V)** Mobile mockup again. The user opens **Skill Creator**, taps `+`, fills in `slug: weekly-summary`, `description: Generate a weekly summary…`, and a body. They save. A toast: `Run make install-bob to deploy.`. Cut to a terminal where `make install-bob` runs and `weekly-summary/SKILL.md` writes into `~/.bob/skills/`.
- **(T)** Caption: `Teach Bob a new trick — from your phone.` 28 pt 600.
- **(VO)** *"Need a custom workflow? Define a Bob skill from your phone. One command later, it lives in Bob's library."*

### Scene 10 — Automations + Security montage · `2:20 – 2:45`

- **(V)** Quick montage, ~5 seconds per panel, smooth horizontal whip-pans:
  1. **Cron scheduler** card showing `0 9 * * *  morning recall  · last run: 2h ago`.
  2. **Codebase explorer** — a folder tree with `analyzed by Granite` chips next to files.
  3. **Auto-wiki** — a generated doc page titled `Auth Architecture` with citations.
  4. **Security dashboard** — the audit-log bar chart pulsing with `skill.create / .update / .delete` events.
- **(T)** A single pinned word in the corner per panel, 60 pt 700 in `#004cca`:
  - `automate.` `analyze.` `document.` `audit.`
- **(VO)** *"Schedule daily recalls. Index your codebase for Granite. Let Cortex write your wiki from the diary itself. Every change tracked, every action logged."*

### Scene 11 — Closing · `2:45 – 3:00`

- **(V)** Hard cut back to dark `#11131c`. The Cortex wordmark glows in primary blue, then a hairline appears beneath it. Below the line, three logos in muted neutral: `IBM Bob`, `Granite`, `Cortex`. A final fade to the tagline in 32 pt 600 white.
- **(T)**
  ```
  cortex
  ─────────────────
  built on IBM Bob and Granite
  ```
  Then on-cut: `your developer's second brain.` (28 pt, italic, color `#b4c5ff`)
- **(VO)** *"Cortex. Built on IBM Bob and Granite. Your developer's second brain."*
- **(SFX)** Final piano chord, long reverb tail. Silence at 2:59.

---

## 4. Asset checklist

What needs to be produced or captured before editing:

- [ ] **Cortex wordmark** — Plus Jakarta Sans, weight 700, primary blue. Lockup + hairline + tagline variant.
- [ ] **Mobile screen captures** (or high-fidelity mocks) at 1080×2340:
  - Today screen (with greeting + status pills)
  - Capture flow with quick-action chips
  - Capture confirmation toast
  - AI Chat with streamed answer + citation chip
  - AI Chat queueing-to-Bob banner
  - Skill Creator list + new-skill modal + saved toast
  - Scheduler list with one cron row
  - Security dashboard with bar chart
  - Wiki list + generated page
- [ ] **Desktop / IDE shot** of IBM Bob receiving a pending action and editing files. Use a real Bob screenshot if available; otherwise a clean mock with the Bob branding visible in the sidebar.
- [ ] **Code-wall b-roll** for Scene 2: dark editor, dim code scrolling. 5 seconds.
- [ ] **Hands-on-laptop / phone-on-desk b-roll** for Scenes 3, 6, 7. License-free is fine if shot quality is high.
- [ ] **Three-card "tiers" composition** for Scene 5 — vector, exportable as a single PNG with alpha so the motion artist can stagger entry.
- [ ] **Music**: 3:00 cinematic piano + pad bed. Suggested tempo 70 BPM. Drop one bass note at 0:30 (logo reveal) and one swell at 1:30 (Bob hand-off).
- [ ] **Voiceover**: full script (Section 5), produced to a single WAV at -16 LUFS, then ducked under the music.

---

## 5. Voiceover script — single readable block

Hand this to the TTS / talent. Pause markers are `[.]` (250 ms) and `[..]` (700 ms).

> Every line of code you write [.] leaves a trail. [..]
> Decisions. Bugs. Insights. [.] They live in your head — until they don't. [..]
>
> Most of what you know never makes it into the codebase. [.] It's lost between commits, [.] between meetings, [.] between days. [..] Until now. [..]
>
> Welcome to Cortex. [.] Your developer's second brain. [..]
>
> Cortex pairs a fast local diary with IBM Granite for reasoning, [.] and IBM Bob for the heavy lifting. [.] Together, they remember what you can't. [..]
>
> Drop a thought from your phone, [.] your terminal, [.] or Telegram. [.] Cortex tags, embeds, and indexes it the moment it lands. [.] No friction. [.] No filing system. [..]
>
> Ask a question the way you'd ask a teammate. [.] Granite answers from your own diary — [.] and shows you exactly where it came from. [..]
>
> When the question outgrows the phone, [.] Cortex queues it for IBM Bob. [.] Bob picks it up at the start of its next session — [.] with full diary context already in hand. [.] The conversation continues, [.] exactly where you left off. [..]
>
> Need a custom workflow? [.] Define a Bob skill from your phone. [.] One command later, it lives in Bob's library. [..]
>
> Schedule daily recalls. [.] Index your codebase for Granite. [.] Let Cortex write your wiki from the diary itself. [.] Every change tracked, [.] every action logged. [..]
>
> Cortex. [.] Built on IBM Bob and Granite. [.] Your developer's second brain.

---

## 6. Slide deck variant (if you want a still-image fallback)

If the video pipeline falls through, the same arc works as a 14-slide Keynote deck. Use the *same scenes* above, with each scene becoming 1–2 slides. Slides 1, 4, 11 are full-bleed dark; slides 5–10 are light surface with the device mockup. Animation between slides: 400 ms cross-dissolve. Run as a self-advancing presentation at ~12 seconds per slide.

---

## 7. Things the designer must NOT do

- No emojis. No exclamation marks in on-screen text.
- No stock "AI brain" imagery. No glowing orbs. No neural-net swirls.
- Don't show competitor product names. Don't claim metrics we haven't measured ("10× faster", etc.).
- Don't render the IBM logo unless the IBM Bob screenshot is real — better to write `IBM Bob` and `IBM Granite` in text.
- Don't cram text. Maximum 9 words on screen at any time outside Scene 3.

---

## 8. Pull-quote bank (if you need fillers)

Use these as overlay text only when the visual needs reinforcement:

- *"Capture without breaking flow."*
- *"Recall by intent, not keywords."*
- *"From phone to IBM Bob, in one tap."*
- *"Built on IBM. Built for builders."*
- *"Your context, remembered."*
- *"Three tiers of memory."*

---

*Direction questions: see `docs/HANDOFF.md` for the technical state of every feature shown. The mobile screens that the script references all exist in `cortex-mobile/app/` (capture, chat, skills, scheduler, security, wiki) — capture them live rather than mocking from scratch.*
