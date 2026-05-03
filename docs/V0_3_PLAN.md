# Cortex v0.3 — Plan

> Three-tier agent architecture · backend ↔ frontend sync · new design system from `theme.md`.

## v0.3 status (as of latest commit)

**Tests:** 113 passing (was 56 at the start of v0.3).

| Area | Status | Where |
|---|---|---|
| Three-tier escalation queue (mobile → Bob) | ✅ Shipped | `pending_actions` table, 4 endpoints, `diary_pending_actions` MCP tool, `bob/rules-cortex/05-pending-actions.md`, `workspace.tsx` Send-to-Bob button |
| Codebase indexer | ✅ Shipped | `cortex_api/codebase.py`, `POST /codebase/index`, `GET /codebase/files`, `GET /codebase/file`, `explorer.tsx` wired |
| Granite `/analyze/code` | ✅ Shipped | `generate.analyze_code`, line-cited responses, fallback to vector recall |
| Granite `/suggest/next` | ✅ Shipped | `generate.suggest_next`, 3 imperative actions cited by `[#id]` |
| Wiki generation | ✅ Shipped | `cortex_api/wiki.py`, `POST /wiki/generate` (Granite), `GET /wiki`, `GET /wiki/{slug}`, mirrored to `docs/wiki/`, `wiki.tsx` wired |
| Calendar aggregation | ✅ Shipped (backend) | `GET /calendar?month=` returns day grid; UI integration deferred (existing `calendar.tsx` is an event scheduler — different model) |
| Skills CRUD | ✅ Shipped (backend) | `cortex_api/skills.py`, full CRUD, slug validation, reserved-slug protection, 9 endpoints |
| Security audit log | ✅ Shipped (backend) | `audit_log` table, `GET /security/audit`, `GET /security/summary`, `skill.*` actions audited |
| New theme tokens | ✅ Shipped | `cortex-mobile/src/constants/theme.ts` with Plus Jakarta Sans, primary `#004cca`, secondary purple `#731be5`, card radius 32, shadow presets |
| 3 new mobile screens | ✅ Shipped | `app/workspace.tsx` · `app/explorer.tsx` · `app/wiki.tsx` |

**Endpoints added in v0.3** (16 total): `/actions/queue`, `/actions/pending`, `/actions/all`, `DELETE /actions/{id}`, `/codebase/index`, `/codebase/files`, `/codebase/file`, `/analyze/code`, `/suggest/next`, `/wiki`, `/wiki/{slug}`, `/wiki/generate`, `/calendar`, `/skills` (4× CRUD), `/security/audit`, `/security/summary`. New MCP tool: `diary_pending_actions`. New Bob mode rule: `05-pending-actions.md`.

**Mobile screens wired to real backend:** `workspace.tsx` (chat + queue), `explorer.tsx` (index + analyze), `wiki.tsx` (list + generate + view).

**Mobile screens whose backend is now real but UI still shows demo data** (one-shot port pending — backend is the gate; this is a UI swap):
- `app/skills.tsx` — uses `getDemoSkills` ; should call `apiListSkills/Create/Delete`
- `app/security.tsx` — static markup ; should call `apiAuditLog/AuditSummary`
- `app/calendar.tsx` — event scheduler, different data model than `/calendar` aggregation; left alone
- `app/scheduler.tsx` — covered by existing `automations` CRUD; cron extension still pending

**Phase D (deferred)** — light/dark toggle hook, onboarding carousel, theme refresh of older pages.



## 1 · Vision: three-tier agents

```
Layer 3: IBM Bob (heavy)         ← invoked from app via pending_actions queue
            ▲
            │  escalate when local Granite isn't confident
            │
Layer 2: Local Granite (light)   ← in-app, reads codebase + docs/ + diary
            ▲
            │  uses as context
            │
Layer 1: Diary (memory)          ← entries (already shipped)
```

The mobile app is the **everyday brain** (capture + Granite reasoning + auto-wiki). Bob is the **escalation tier** for serious lifts (deep refactors, multi-file changes).

---

## 2 · Design system (from `theme.md`)

| Token | Value | Notes |
|---|---|---|
| **font ui** | `Plus Jakarta Sans` (400/600/700) | Replaces IBM Plex Sans |
| **font mono** | `Space Grotesk` (400) | Replaces IBM Plex Mono |
| **primary** | `#004cca` | Deeper blue than IBM Blue 60 |
| **primary-fixed** | `#dbe1ff` | Tinted blue chip background |
| **primary-container** | `#0062ff` | Brighter for fills |
| **secondary** | `#731be5` | Purple — net-new accent |
| **secondary-fixed** | `#ebdcff` | Tinted purple chip |
| **tertiary** | `#8e4000` | Warm orange |
| **tertiary-fixed** | `#ffdbc9` | Tinted orange chip |
| **surface / background** | `#f9f9fe` | Near-white |
| **surface-variant** | `#e2e2e7` | Card border |
| **on-surface** | `#1a1c1f` | Text |
| **on-surface-variant** | `#424656` | Muted text |
| **outline** | `#737687` | Icons / lines |
| **error** | `#ba1a1a` | Carbon-aligned |
| **radius card** | `32px` | Soft pill cards (vs Carbon's 0px) |
| **radius input** | `12px` | Inputs |
| **radius chip** | `100px` | Pill chips |
| **radius xl** | `0.75rem` | Misc |
| **gutter** | `24px` | Grid gutter |
| **container-padding** | `40px` | Page padding |
| **stack-sm/md/lg** | `12 / 24 / 48px` | Vertical rhythm |

Type scale:
- `h1` 40px / 700 / line-height 1.2
- `h2` 32px / 700 / line-height 1.2
- `h3` 24px / 600 / line-height 1.3
- `body-lg` 18px / 400 / line-height 1.6
- `body-md` 16px / 400 / line-height 1.5
- `label-sm` 14px / 600 / letter-spacing 0.02em
- `mono-code` 14px / 400 (Space Grotesk)

**Light + dark toggle:** light is the default per the new theme. Dark mode swaps surface to `#0b0e16`-family and inverts on-surface (per the existing `<html class="dark">` blocks). Toggle stored in `expo-secure-store` (mobile) / `localStorage` (web).

---

## 3 · Page map (5 main + supporting)

| Mockup (theme.md) | Mobile route | Web route (legacy) | Backend endpoints | Status |
|---|---|---|---|---|
| **Workspace** (AI chat with Granite, escalate to Bob) | `app/workspace.tsx` (new) | `/workspace` (new) | `POST /api/v1/chat` (✅), `POST /api/v1/actions/queue` (❌), `GET /api/v1/actions/pending` (❌) | Granite chat works; queue missing |
| **Explorer** (codebase indexer) | `app/explorer.tsx` (new) | `/explorer` (new) | `POST /api/v1/codebase/index` (❌), `GET /api/v1/codebase/files` (❌), `GET /api/v1/search?kind=code` (✅ filter works) | All missing |
| **Graph** (knowledge graph) | `app/identity.tsx` ✅ (rename → `graph.tsx`?) | `/identity` ✅ | `GET /api/v1/identity/graph` ✅ | Works; needs new theme |
| **Snippets** (notes vault) | `app/timeline.tsx` ✅ (or new `app/snippets.tsx`) | `/timeline` ✅ | `GET /api/v1/entries` ✅ | Works; needs new theme |
| **Docs** (wiki / generated docs) | `app/wiki.tsx` (new) | `/wiki` (new) | `GET /api/v1/wiki` (❌), `POST /api/v1/wiki/generate` (❌), `GET /api/v1/wiki/{slug}` (❌) | All missing |

Plus existing screens that need theme refresh: `today (index)`, `search`, `ideas`, `debug`, `report`, `analytics`, `productivity`, `github`, `automations`, `wellness`, `news`, `profile`, `settings`, `entry/[id]`, `bob`, `calendar`, `scheduler`, `skills`, `security`, `more`, `chat`, `capture`.

---

## 4 · Backend status — what's real vs what's missing

### ✅ Already real

| Endpoint | Used by |
|---|---|
| `POST /api/v1/entries` | All capture surfaces |
| `GET /api/v1/entries` | Timeline, kind-filter |
| `GET /api/v1/entries/{id}` | Entry detail |
| `GET /api/v1/search` | Search, recall, ⌘K |
| `PATCH /api/v1/entries/{id}/link` | Code-link |
| `POST /api/v1/entries/{id}/feedback` | 👍/👎 |
| `GET /api/v1/today` | Today dashboard |
| `GET /api/v1/reports/daily` | Daily report |
| `GET /api/v1/analytics/session` | Session analytics |
| `GET /api/v1/identity/graph` | Knowledge graph |
| `GET /api/v1/github/activity` | Activity heatmap |
| `GET/POST /api/v1/wellness/*` | Touch grass |
| `GET/PATCH /api/v1/profile` | Profile |
| `GET/POST/PATCH/DELETE /api/v1/automations` | Automations CRUD |
| `POST /api/v1/chat` | Granite RAG chat |
| `POST /api/v1/generate/summary/{id}` | Entry summary |
| `GET /api/v1/generate/report` | Narrative report |
| `GET /api/v1/llm/info` | LLM provider info |
| `POST /api/v1/modernization/analyze` | Code modernization |
| `POST /api/v1/legacy/analyze` | Legacy analyzer |
| `GET /api/v1/metrics/productivity` | ROI dashboard |

### ❌ Missing — needed for v0.3

| Endpoint | Method | Body / Query | Returns | Owner |
|---|---|---|---|---|
| `/api/v1/actions/queue` | POST | `{kind, payload}` | `{id, created_at}` | M2 |
| `/api/v1/actions/pending` | GET | — | `{actions: [...]}` | M2 |
| `/api/v1/codebase/index` | POST | `{path, max_files?}` | `{indexed, skipped, errors}` | M2 |
| `/api/v1/codebase/files` | GET | `?path=` | `{files: [{path, kind, lines}]}` | M2 |
| `/api/v1/codebase/file` | GET | `?path=` | `{path, content, embedding_id?}` | M2 |
| `/api/v1/analyze/code` | POST | `{file, question}` | `{answer, citations}` (Granite) | M2 + M4 |
| `/api/v1/suggest/next` | GET | `?cwd=` | `{suggestions: [...]}` (Granite) | M2 + M4 |
| `/api/v1/wiki` | GET | — | `{pages: [{slug, title, updated_at}]}` | M2 |
| `/api/v1/wiki/{slug}` | GET | — | `{slug, title, body, updated_at}` | M2 |
| `/api/v1/wiki/generate` | POST | `{topic, sources?: ["entries", "code"]}` | `{slug, title, body}` (Granite) | M2 + M4 |
| `/api/v1/skills` | GET | — | `{skills: [{slug, description}]}` | M2 |
| `/api/v1/skills/{slug}` | GET | — | `{slug, description, body}` | M2 |
| `/api/v1/skills` | POST | `{slug, description, body}` | `{slug}` | M2 |
| `/api/v1/skills/{slug}` | DELETE | — | `204` | M2 |
| `/api/v1/calendar` | GET | `?month=YYYY-MM` | `{days: [{date, count, kinds}]}` | M2 |
| `/api/v1/scheduler/jobs` | GET / POST / PATCH / DELETE | cron-style | runs every 60s | M2 |
| `/api/v1/security/audit` | GET | `?since=` | `{events: [...]}` | M2 |

### MCP tools to add

| Tool | Purpose |
|---|---|
| `diary_pending_actions` | Bob calls at session start; pops queue; returns actions for Bob to surface to dev |
| `diary_index_codebase` | Bob can trigger an index of `cwd` |
| `diary_generate_wiki` | Bob can request wiki generation on a topic |

---

## 5 · Frontend tasks (mobile)

| Page | Effort | What's missing |
|---|---|---|
| `theme.ts` rewrite to new tokens | 1 h | Plus Jakarta Sans, new colors, 32px card radius, label-sm typography |
| `_layout.tsx` bottom nav redesign | 0.5 h | 5 main tabs (Workspace/Explorer/Graph/Snippets/Docs) + overflow `more` |
| `app/workspace.tsx` (NEW) | 2 h | Granite chat with citations; "Send to Bob" escalation button |
| `app/explorer.tsx` (NEW) | 2 h | File tree, file viewer, "ask about this file" → /analyze/code |
| `app/wiki.tsx` (NEW) | 1.5 h | Pages list, page view, "Generate doc on…" form |
| `app/identity.tsx` theme refresh | 0.5 h | Match new design |
| `app/timeline.tsx` theme refresh (Snippets) | 0.5 h | Match new design |
| `app/calendar.tsx` real backend | 0.5 h | Replace `getDemoCalendarEvents` with `apiGetCalendar` |
| `app/scheduler.tsx` real backend | 1 h | Real CRUD against `/scheduler/jobs` |
| `app/skills.tsx` real backend | 1 h | Real CRUD against `/skills` + show "run install-bob" hint |
| `app/security.tsx` real backend | 1 h | Audit log from `/security/audit` |
| `app/bob.tsx` queue integration | 0.5 h | Add "Send to Bob" button using `/actions/queue` |
| Light/dark toggle hook + UI | 1 h | `useColorScheme()` + persist via `expo-secure-store` |
| Onboarding (first-launch carousel) | 1 h | 3 cards: Capture / Recall / Bob |

**Total mobile: ~14 hours**

---

## 6 · Backend tasks

| Task | Effort | Depends on |
|---|---|---|
| `pending_actions` table + endpoints + MCP tool | 2 h | — |
| Bob mode rule `05-pending-actions.md` | 0.5 h | tool exists |
| Codebase walker + `kind="code"` embedding | 2 h | — |
| `/analyze/code` and `/suggest/next` (Granite) | 2 h | walker |
| Wiki: storage, generate, retrieve, embed | 2 h | walker (uses code as context too) |
| Skills CRUD + filesystem write | 1.5 h | — |
| Calendar aggregation endpoint | 0.5 h | — |
| Scheduler module (croniter, 60s tick) | 2.5 h | — |
| Security audit log | 1 h | — |
| pytest for everything new | 2 h | endpoints exist |

**Total backend: ~16 hours**

---

## 7 · Implementation phases

### Phase A — Theme + foundation (3 h)
1. Update `cortex-mobile/src/constants/theme.ts` with new tokens
2. Add font loading (Plus Jakarta Sans, Space Grotesk via `expo-font`)
3. Add light/dark toggle hook + persist
4. Update `_layout.tsx` bottom nav to 5 tabs

### Phase B — Real backend for the 4 mocked screens (5 h)
1. Calendar aggregation endpoint (0.5 h) → wire `calendar.tsx`
2. Scheduler module + endpoints (2.5 h) → wire `scheduler.tsx`
3. Skills CRUD (1.5 h) → wire `skills.tsx`
4. Security audit log (1 h) → wire `security.tsx`

### Phase C — Three-tier features (10 h)
1. `pending_actions` queue + MCP tool + Bob mode rule (2.5 h)
2. Codebase indexer + `/analyze/code` + `/suggest/next` (4 h)
3. Wiki generation (2 h)
4. New mobile pages: `workspace.tsx`, `explorer.tsx`, `wiki.tsx` (5.5 h — overlaps backend)

### Phase D — Polish + tests (3 h)
1. Theme refresh existing pages: `identity.tsx`, `timeline.tsx`, etc. (1.5 h)
2. Onboarding (1 h)
3. pytest for new endpoints (2 h)

**Total ≈ 21 hours.** Split across 3 members, ~7h each, achievable inside the remaining hackathon window.

---

## 8 · Bob coin allocation for v0.3 work

| Member | Bob session | Coins |
|---|---|---|
| M2 (Backend) | Generate `pending_actions` migration + MCP tool + tests | ~5 |
| M2 | Generate codebase walker + chunker + tests | ~5 |
| M3 (Mobile) | Generate `workspace.tsx` + `explorer.tsx` + `wiki.tsx` from mockups | ~6 |
| M3 | Theme.ts rewrite + bottom nav redesign | ~3 |
| M4 (AI) | Wire `/analyze/code` + `/suggest/next` Granite prompts; tune output quality | ~5 |
| M4 | Wiki generation Granite prompts | ~3 |
| Buffer | | ~5 |

**Total: ~32 of remaining ~76 coins.**

---

## 9 · Acceptance criteria

A v0.3 demo passes if:

1. `make dev` boots api + mobile (Expo)
2. **Capture from mobile** → entry visible in **Bob /diary-recall** (cross-tier proven)
3. **Bob/diary-save** in IDE → entry visible in **mobile timeline** within 5s
4. Mobile `app/workspace.tsx` answers a question with Granite, citing `[#id]` from real entries
5. Mobile `app/workspace.tsx` "Send to Bob" enqueues an action; Bob's next session pops the queue and surfaces it (proves escalation)
6. Mobile `app/explorer.tsx` indexes a sample repo; `app/workspace.tsx` query "what does file X do" returns Granite answer grounded in `kind="code"` entries
7. Mobile `app/wiki.tsx` "Generate doc: 'authentication architecture'" produces a markdown page that's readable and saved
8. Calendar / scheduler / skills / security all use real endpoints (no `getDemo*` calls in production code paths)
9. Theme renders correctly in both light + dark modes; toggle works in Settings
10. pytest green (≥80 tests)

---

## 10 · Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Granite 2B output quality on real code analysis is weak | M | The "escalate to Bob" button IS the answer — Granite is the cheap first try |
| Codebase indexer hits embedding rate limits | L | Batch + sleep; or use local sentence-transformers for `kind="code"` only |
| Scheduler timing flakes inside Docker | L | Run scheduler as a separate FastAPI startup task; use `croniter` |
| Plus Jakarta Sans not available offline | L | Bundle font via `expo-font.loadAsync` |
| Bob doesn't auto-call `diary_pending_actions` | M | Mode rule says "at session start"; if Bob ignores, fall back to manual `/diary-pending` slash command |
| Local Granite GGUF too large for mobile | H | Local Granite stays on the server (cortex-api). Mobile calls server's `/chat`. The "on-device" pitch becomes "on-LAN" — still privacy-friendly. |

---

## 11 · Files to create / update

### New (mobile)
- `cortex-mobile/app/workspace.tsx`
- `cortex-mobile/app/explorer.tsx`
- `cortex-mobile/app/wiki.tsx`
- `cortex-mobile/src/services/wiki.ts`
- `cortex-mobile/src/services/codebase.ts`
- `cortex-mobile/src/services/actions.ts`
- `cortex-mobile/src/hooks/useColorScheme.ts`

### New (backend)
- `src/cortex-api/cortex_api/codebase.py`
- `src/cortex-api/cortex_api/wiki.py`
- `src/cortex-api/cortex_api/scheduler.py`
- `src/cortex-api/cortex_api/skills.py`
- `src/cortex-api/cortex_api/actions.py`
- `bob/rules-cortex/05-pending-actions.md`

### Updated
- `cortex-mobile/src/constants/theme.ts` (new design tokens)
- `cortex-mobile/app/_layout.tsx` (5-tab bottom nav)
- `cortex-mobile/app/calendar.tsx` (real API)
- `cortex-mobile/app/scheduler.tsx` (real API)
- `cortex-mobile/app/skills.tsx` (real API)
- `cortex-mobile/app/security.tsx` (real API)
- `cortex-mobile/app/identity.tsx` (theme refresh)
- `cortex-mobile/app/timeline.tsx` (theme refresh)
- `cortex-mobile/app/bob.tsx` (queue button)
- `src/cortex-api/cortex_api/server.py` (new endpoints + middleware)
- `src/cortex-api/cortex_api/storage.py` (new tables)
- `src/cortex-api/cortex_api/tools.py` (new MCP tool)
- `tests/` (new test files)
