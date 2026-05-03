# Cortex — Handoff Doc

**As of `1a42718` on `main` · 2026-05-03**

A coordination doc so a teammate (or their LLM) can pick up where we left off without re-reading every commit. Skim this top-to-bottom once, then jump to the section that matches what you're touching.

---

## TL;DR — what just shipped

Last 5 commits (newest first):

| Commit | Subject |
|---|---|
| `1a42718` | chore(deps): add `croniter` to `requirements-no-llm.txt` + `requirements-minimal.txt` |
| `97b3b56` | feat(mobile): dark mode hook + first-launch onboarding |
| `b23445b` | feat(api): cron-style scheduler for automations |
| `86c17d1` | feat(mobile): wire skills + security screens to real cortex-api |
| `4421e86` | docs(v0.3): completion status |

Everything is on `origin/main`. Backend test suite: **124/124 green** (`.venv/bin/python -m pytest`).

---

## Repo map

```
ibm-hackathon/
├── src/cortex-api/         FastAPI backend, port 8080      (PRIMARY SERVICE)
│   └── cortex_api/
│       ├── server.py        REST endpoints + middleware + lifespan
│       ├── storage.py       sqlite-vec; schema + migrations live here
│       ├── scheduler.py     NEW — cron-style automation runner
│       ├── skills.py        SKILL.md filesystem CRUD under bob/skills/
│       ├── codebase.py      repo indexer → entries with kind="code"
│       ├── wiki.py          Granite-generated docs, mirrored to docs/wiki/
│       ├── retrieval.py     vector + recency re-rank
│       ├── generate.py      Granite RAG: chat, analyze_code, suggest_next, daily_narrative
│       ├── embeddings.py    watsonx + sentence-transformers fallback
│       ├── llm.py           Granite 8B cloud + Granite 2B GGUF local fallback
│       ├── secrets.py       11-pattern + entropy server-side guard
│       ├── tools.py         MCP tool definitions (incl. diary_pending_actions)
│       └── mcp_server.py    stdio MCP server (Bob talks to this)
│
├── src/cortex-bot/         Telegram bot                    (SECONDARY)
│
├── cortex-mobile/          Expo + React Native             (PRIMARY CLIENT)
│   ├── app/                Expo Router screens (one file = one route)
│   └── src/
│       ├── constants/theme.ts     design tokens — see "Theme rules"
│       ├── hooks/useThemeMode.tsx NEW — light/dark/system + SecureStore
│       └── services/api.ts        full backend client (single source of truth)
│
├── bob/                    IBM Bob extensions
│   ├── skills/cortex/      reserved skill (read-only from the app)
│   ├── rules-cortex/       behavioral rules; 05-pending-actions wires the queue
│   ├── commands/           /diary-save, /diary-recall slash commands
│   └── INSTALL.md          how Bob picks up MCP + rules + skills
│
├── tests/                  pytest, 124 tests; conftest patches settings in-place
└── docs/
    ├── V0_3_PLAN.md        the master plan (skim "Status" section)
    ├── CONTRACTS.md        REST contract (slightly behind v0.3 endpoints)
    └── HANDOFF.md          this file
```

The legacy `cortex-web/` (React + Carbon) was demoted; mobile is the primary client now. Don't add features there.

---

## Three-tier agent — the mental model

This is the architecture pitch in one paragraph. Internalize it before changing anything memory-related.

```
[Capture]  →  Diary       (sqlite-vec, fast retrieval, no reasoning)
              │
              ↓ on chat / question
           Local Granite  (2B GGUF; small but private; tool-calls Diary)
              │
              ↓ when uncertain or when the user taps "Send to Bob"
           IBM Bob        (full MCP session; reads pending_actions queue)
```

**Diary** is the source of truth. **Local Granite** answers fast. **Bob** is the escalation tier — we don't call Bob synchronously; we *queue* an action via `POST /api/v1/actions/queue`, and Bob picks it up at the start of its next session via the `diary_pending_actions` MCP tool (mode rule `05-pending-actions.md` drives the polling).

---

## Backend — what's live

**Run**: `cd src/cortex-api && uvicorn cortex_api.server:app --port 8080 --reload`. Or use the Makefile (`make api`).

### Endpoints added in this push (skills/audit/codebase/wiki/scheduler)

```
POST   /api/v1/actions/queue                  enqueue for Bob
GET    /api/v1/actions/pending?consume=…      Bob pops the queue
GET    /api/v1/actions/all                    audit view
DELETE /api/v1/actions/{id}

POST   /api/v1/codebase/index                 walk repo, embed code chunks
GET    /api/v1/codebase/files                 list indexed files
GET    /api/v1/codebase/file?repo=…&path=…
POST   /api/v1/analyze/code                   Granite RAG over code chunks
GET    /api/v1/suggest/next                   Granite suggests 3 actions

GET    /api/v1/wiki                           list pages
GET    /api/v1/wiki/{slug}
POST   /api/v1/wiki/generate                  Granite-write a doc, mirror to disk
GET    /api/v1/calendar?month=YYYY-MM         entries grouped by day

GET    /api/v1/skills                         list bob/skills/<slug>/SKILL.md
GET    /api/v1/skills/{slug}
POST   /api/v1/skills                         create (slug + 30+ char desc + body)
PATCH  /api/v1/skills/{slug}
DELETE /api/v1/skills/{slug}

GET    /api/v1/security/audit?since=&limit=   audit_log rows
GET    /api/v1/security/summary?window_hours= rollup for the dashboard

# v0.3 polish (latest)
POST   /api/v1/automations            now accepts {schedule: "5-field cron"}
POST   /api/v1/automations/{id}/run   manual fire (bypasses cron)
POST   /api/v1/scheduler/tick         force one scheduler pass (tests + UI)
```

Auth is bearer-token (`DIARY_TOKEN`); CORS tightens in non-reload mode; security headers + rate limiting middleware are in `server.py`.

### The scheduler (new in `b23445b`)

`cortex_api/scheduler.py` is the critical thing to understand if you touch automations.

- **`tick(now_ms=None) → list[dict]`** is **synchronous**. Tests call this directly. The `/api/v1/scheduler/tick` endpoint is just `tick()`.
- **`run_loop(stop_event)`** is the asyncio daemon, started from `lifespan()` in `server.py`. It calls `asyncio.to_thread(tick)` every `TICK_SECONDS` (30s).
- **Skipped under `settings.reload`** (i.e. dev mode + tests) to keep test runs deterministic. If you want the loop running while you `--reload`, flip `settings.reload` to `False` *or* hit `/scheduler/tick` manually.
- **Three action kinds** are dispatched by `trigger_kind`:
  - `notify` → audit-log only.
  - `recall` → enqueues a `recall` on `pending_actions` (Bob picks it up).
  - `report` → tries `generate.daily_narrative()` + queues a `free` action carrying the narrative preview. Falls back to a stub audit if Granite isn't reachable.
- **Cron parsing**: `croniter` (now in all three requirements files). Bad expressions are rejected at write-time with a 400; missing `croniter` at runtime makes `_parse_cron` log a warning and skip — the loop is best-effort by design.
- Every fire writes an `audit_log` row (`actor=scheduler`, `action=automation.fired`), so the mobile Security screen reflects scheduler activity automatically.

### Storage / migrations

`storage.py:MIGRATIONS_SQL` is a list of `ALTER TABLE` statements run best-effort at every `init_db()`. Errors are swallowed (the only thing they complain about is "duplicate column" on already-migrated DBs). When you add a column, *append* to that list — don't rewrite the table.

Newly added columns on `automations`: `schedule TEXT NOT NULL DEFAULT ''`, `last_run_at INTEGER NULL`, `run_count INTEGER NOT NULL DEFAULT 0`.

### Tests

```
.venv/bin/python -m pytest               # 124/124
.venv/bin/python -m pytest tests/test_scheduler.py -x -q  # 11 scheduler-specific
```

`tests/conftest.py` autouses an isolated tmp DB per test and patches `settings` *in place* so already-imported modules see the new values. If you write a test that hits an endpoint relying on `settings.reload=False`, your scheduler will run inside the test — patch `settings.reload=True` for that test.

### Known gotchas

- **sqlite-vec extension load** — vec0 virtual table fails to load on some Python builds (you'll see `vec_entries virtual table unavailable: no such module: vec0`). The code falls back to a Python cosine path silently. Don't "fix" the warning unless the fallback is actually slow.
- **CORS / OPTIONS test cases** — there are pre-existing flaky bad-test-setup failures in `test_security_phase2.py` if you ever look. Per session feedback, leave them alone.
- **Scheduler in tests** — see above; don't accidentally start the loop in a unit test.

---

## Mobile — what's live

**Run**: `cd cortex-mobile && npm install && npm start`. Scan the QR with Expo Go, or `npm run ios` / `npm run android`.

### Theme system (`src/constants/theme.ts`)

`theme.ts` is the spec. Plus Jakarta Sans for UI, Space Grotesk (mono) for code, primary `#004cca`, secondary `#731be5`, tertiary `#8e4000`, card radius 32, chip radius 100, near-white `#f9f9fe` surface. Light + dark palettes both exported.

**Back-compat aliases** I added: `primaryLight` / `secondaryLight` / `tertiaryLight`. These are *not* in the original spec — they map to the soft-tint `*Fixed` colors. Reason: legacy screens (`bob`, `calendar`, `identity`, `profile`, `more`, `debug`, `index`) still reference the old `primaryLight` token and a sweeping rename was out of scope. **Don't add new uses of `*Light`.** When you touch a legacy screen, replace `Colors.primaryLight` with `Colors.primaryFixed` and remove the alias once nothing references it.

### Dark mode (`src/hooks/useThemeMode.tsx`)

```ts
import { useThemeMode } from '../src/hooks/useThemeMode';
const { Colors, scheme, mode, setMode } = useThemeMode();
```

- `mode` is the user preference: `'light' | 'dark' | 'system'`.
- `scheme` is the resolved light/dark.
- `Colors` is the resolved palette — **prefer reading from the hook** in new screens, not the module-level import.
- Persisted to expo-secure-store under `cortex.theme_mode`.
- Toggle UI lives in `app/settings.tsx` ("Appearance" section).
- `_layout.tsx` wraps the whole tree in `<ThemeProvider>`; StatusBar style flips automatically.

### First-launch onboarding (`app/onboarding.tsx`)

- 3-card horizontal carousel: Capture / Recall / Bob.
- Gated by `cortex.onboarding_seen` flag in expo-secure-store.
- `app/index.tsx` checks the flag on mount and `router.replace('/onboarding')` if unseen. Lazy-imported (`import('./onboarding')`) to dodge an Expo Router circular-import hazard.
- Helpers: `hasSeenOnboarding()`, `markOnboardingSeen()` (both exported from `app/onboarding.tsx`).
- To re-trigger for a demo: clear app data, or `await SecureStore.deleteItemAsync('cortex.onboarding_seen')`.

### Backend client (`src/services/api.ts`)

Single source of truth for the REST contract. Newly added or extended:

```ts
// Skills CRUD
apiListSkills(), apiGetSkill(slug), apiCreateSkill({slug, description, body, name?}),
apiUpdateSkill(slug, fields), apiDeleteSkill(slug)

// Security
apiAuditLog(since?, limit), apiAuditSummary(windowHours)

// Codebase + Granite
apiIndexCodebase(path, opts), apiListIndexedFiles(repo?), apiGetIndexedFile(repo, path),
apiAnalyzeCode(file, question, k), apiSuggestNext(limit)

// Wiki
apiListWiki(), apiGetWiki(slug), apiGenerateWiki(topic, sources?)

// Calendar
apiCalendar(month?)

// Pending actions (Bob queue)
apiQueueAction(kind, payload, source), apiPendingActions(consume?, limit), apiAllActions(limit), apiDeleteAction(id)

// Automations + scheduler
apiCreateAutomation({name, trigger_kind, action, schedule?})  // schedule is new
apiRunAutomationNow(id), apiTickScheduler()
```

**Configuration**: API base URL + bearer token live in AsyncStorage under `cortex.api_base_url` and `cortex.diary_token`. The Profile/Settings screens write them. Most screens degrade to an "API not configured" notice when these are missing — keep that pattern.

### Screens — current state per route

| Screen | State | Notes |
|---|---|---|
| `index.tsx` (Today) | wired | API + local DB + demo fallback chain. Onboarding redirect added. |
| `capture.tsx` | wired | local DB; mirrors to API when configured |
| `chat.tsx` | wired | `apiChat`; Granite citations |
| `search.tsx` | wired | `apiSearchEntries` |
| `more.tsx` | wired | grid → secondary screens |
| `timeline.tsx` | wired | `apiListEntries` |
| `entry/[id].tsx` | wired | `apiGetEntry` + feedback |
| `workspace.tsx` | wired | Granite chat + queue-to-Bob button |
| `explorer.tsx` | wired | `apiIndexCodebase` + `apiAnalyzeCode` |
| `wiki.tsx` | wired | list + view + generate |
| `calendar.tsx` | wired | `apiCalendar`; uses `Colors.primaryLight` (legacy alias) |
| **`skills.tsx`** | **wired (new)** | full CRUD; managed skills lock-pinned; `make install-bob` reminder |
| **`security.tsx`** | **wired (new)** | audit log + summary, 1h/24h/7d window toggle |
| `scheduler.tsx` | **demo data still** | this is the *next* candidate to wire to the cron backend (see "What's left") |
| `automations.tsx` | partial | doesn't expose the new `schedule` field yet — pickup task |
| `settings.tsx` | wired | API config + new Appearance toggle |
| `profile.tsx` | wired | `apiGetProfile` + analytics |
| `bob.tsx` | static | concept screen, OK to leave |
| Other (`analytics`, `wellness`, `github`, `news`, `debug`, `ideas`, `identity`, `report`) | wired or local-only | low-priority, no breakage |
| **`onboarding.tsx`** | **new** | 3-card carousel, first-launch only |

---

## Design system — `src/components/ui/`

**This is the path forward.** Every screen should compose from these primitives instead of hand-rolling layouts. They consume `useThemeMode().Colors` internally, so dark mode propagates automatically.

```ts
import {
  Screen, Header, Card, Button, Pill,
  EmptyState, Section, IconButton, StatusBanner,
} from '../src/components/ui';
```

| Primitive | What it's for |
|---|---|
| `<Screen>` | Page wrapper. SafeArea + tab-bar padding + theme bg + optional pull-to-refresh. |
| `<Header>` | Top bar with back button, title, eyebrow, right-side actions slot. |
| `<Card>` | Surfaces. Variants: `surface` `primary` `secondary` `tertiary` `outlined`. Sizes: `hero` (radius 32) / `list` (radius 12). |
| `<Button>` | Primary / secondary / ghost / danger / outlined. With icon support. |
| `<Pill>` | Inline status chip. Tones: `primary` `success` `warning` `error` `secondary` `neutral`. |
| `<EmptyState>` | Friendly empty/blocked state. Always include this when a list could be empty or a feature is gated. |
| `<Section>` | Labelled vertical group with eyebrow + optional trailing CTA. |
| `<IconButton>` | Circular icon-only button — for headers, FABs. |
| `<StatusBanner>` | Inline info/success/warning/error banner with optional CTA. |

### Migration recipe (legacy screen → design system)

For the remaining un-migrated screens (`bob.tsx`, `wellness.tsx`, `analytics.tsx`, `automations.tsx`, `calendar.tsx`, `debug.tsx`, `github.tsx`, `ideas.tsx`, `identity.tsx`, `news.tsx`, `report.tsx`, `scheduler.tsx`, `timeline.tsx`, `wiki.tsx`, `workspace.tsx`, `explorer.tsx`, `entry/[id].tsx`, `profile.tsx`, `skills.tsx`, `security.tsx`, `onboarding.tsx`):

1. **Replace** `import { Colors, ... } from '../src/constants/theme';` →  
   `import { useThemeMode } from '../src/hooks/useThemeMode';` and read `const { Colors } = useThemeMode();` inside the component.
2. **Wrap** outer SafeAreaView in `<Screen>` and the header row in `<Header>`.
3. **Replace** ad-hoc list cards / surfaces with `<Card variant="surface" size="list">`.
4. **Move** `Colors.x` references out of `StyleSheet.create` (they're captured statically) into inline styles or apply them to elements directly. Static tokens (`Spacing`, `Radius`, `Typography`) can stay in StyleSheet.
5. **Replace** every "no data / not configured" block with `<EmptyState>`.
6. **Replace** every status badge with `<Pill>`.

A migrated screen should have **zero** hardcoded hex codes in its file (everything comes from `Colors`), and its StyleSheet should reference *only* `Spacing`, `Radius`, and dimensional values — never colors.

### Already migrated (use as references)

`index.tsx`, `search.tsx`, `more.tsx`, `capture.tsx`, `chat.tsx`, `settings.tsx`. These show the canonical pattern.

### Nav bar

`_layout.tsx` is the source of truth for the tab bar:
- 4 tabs (Today / Search / Ask / More) — icons-only, no labels.
- A center FAB (Capture) hangs above the tab bar.
- All other screens are registered with `href: null` so they're routable but hidden from the tabs.
- Fonts are loaded with `useFonts` at the root; the layout returns `null` until fonts are ready, which fixes the "upside-down triangle" Ionicons bug.

---

## What's left (good pickup tasks)

In rough priority order:

1. **Wire `app/scheduler.tsx` and `app/automations.tsx` to the cron backend.** Backend is 100% ready (`apiCreateAutomation` accepts `schedule`, `apiRunAutomationNow`, `apiTickScheduler` all exist). The UI still uses `getDemoScheduledTasks`. Add a cron-expression input + a "Run now" button + show `last_run_at` and `run_count`.
2. **Theme refresh of legacy screens.** Replace `Colors.primaryLight` (alias) with `Colors.primaryFixed` everywhere; bump card radius from 14 → 32 to match the new spec; bring hardcoded `#f4f5fb` backgrounds onto `Colors.background`. Affected: `bob.tsx`, `calendar.tsx`, `identity.tsx`, `profile.tsx`, `more.tsx`, `debug.tsx`, `index.tsx`, `automations.tsx`. Once nothing references `*Light`, delete the alias from `theme.ts`.
3. **Mobile build verification.** I haven't actually run `npm install` + Expo on this machine — node_modules is missing. First teammate to test should do this and screenshot any runtime errors. The dark mode + onboarding flows are unverified end-to-end.
4. **Integration test for the scheduler loop.** All 11 scheduler tests are unit-level (`tick()` invoked directly). Adding one test that boots the full FastAPI app *with* `settings.reload=False`, lets the asyncio task run, and asserts a fire happens would close the gap.
5. **Wiki disk mirror cleanup.** `wiki.generate_page()` writes to `docs/wiki/<slug>.md`. There's no cleanup when a page is regenerated under a new slug — orphaned files accumulate. Low priority, but worth a sweep.

---

## Conventions worth knowing

- **Commit style**: Conventional Commits prefix (`feat(scope):`, `chore(deps):`, `docs:`, `fix:`). Body wraps at 72 cols. **No Claude attribution** — see `CLAUDE.md` rule 5. Don't add `Co-Authored-By` trailers.
- **No `git add -A` / `git add .`** — stage files explicitly. The repo has stray `.txt` notes and `.bat` scripts that shouldn't ship.
- **Tests must hit a real DB**, not mocks. The `_isolated_env` fixture gives every test its own tmp sqlite — use it.
- **Don't bypass pre-commit hooks** with `--no-verify`. If a hook fails, fix the cause; the commit didn't happen, so make a *new* commit, never `--amend` after a failed hook.
- **Avoid backwards-compat shims** unless explicitly needed. The `*Light` aliases I added are an exception, justified above.

---

## Quick smoke-test recipes

**Backend up**:
```
cd src/cortex-api
.venv/bin/python -m uvicorn cortex_api.server:app --port 8080 --reload
```

**Curl the new stuff** (replace `$T` with your `DIARY_TOKEN`):
```bash
# create a cron automation
curl -X POST localhost:8080/api/v1/automations \
  -H "Authorization: Bearer $T" -H "Content-Type: application/json" \
  -d '{"name":"morning recall","trigger_kind":"recall","action":"what did I work on yesterday","schedule":"0 9 * * *"}'

# force a tick
curl -X POST localhost:8080/api/v1/scheduler/tick -H "Authorization: Bearer $T"

# create a skill
curl -X POST localhost:8080/api/v1/skills \
  -H "Authorization: Bearer $T" -H "Content-Type: application/json" \
  -d '{"slug":"weekly-summary","description":"Generate a weekly summary of what I worked on, grouped by repo.","body":"Step 1: list entries from the last 7 days. Step 2: group by repo. Step 3: write a 200-word summary."}'

# audit summary
curl -H "Authorization: Bearer $T" "localhost:8080/api/v1/security/summary?window_hours=24"
```

**Bob plug-in**:
```bash
make install-bob   # copies bob/skills, bob/rules-cortex, bob/commands into ~/.bob/
make verify-mcp    # validates ~/.bob/settings/mcp_settings.json points at our stdio server
```

---

## Open questions for the next person

- Are we keeping `requirements-no-llm.txt` and `requirements-minimal.txt` in lockstep? They've drifted before.
- Should `app/scheduler.tsx` (the cron UI) and `app/automations.tsx` (the legacy event-driven UI) be merged into one screen, since they're both just "automations"?
- The Bob mode rule `05-pending-actions.md` polls the queue at session start. If a session is long-running, queued actions sit until next session — do we need a way to push to an active session? (Probably out of hackathon scope.)

---

*Questions on any of the above, ask the LLM with this doc + the relevant file in context — the file paths are precise so it can grep its way around without you describing the layout.*
