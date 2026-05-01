# Starting prompt for non-Bob AI agents

Use this prompt when you start any session in **Claude Code, Cursor, GitHub Copilot Chat, v0.app, or any other AI coding assistant that is NOT IBM Bob**. This ensures every session has the same context and follows project rules.

> ⚠️  **Never paste this into IBM Bob** — Bob has its own context via the `cortex` skill, mode, and rules. Bob sessions are tracked separately in `docs/BOB_USAGE.md`; non-Bob sessions are not.

## Copy-paste prompt

```
You are working on Cortex — a developer's second brain integrated with IBM Bob via MCP, custom mode, skill, slash commands, and mode rules.

PROJECT CONTEXT
- Hackathon: IBM Bob Dev Day, May 1-3 2026, submit by Sunday 10:00 AM ET (=15:00 BST)
- Theme: "Turn idea into impact faster with IBM Bob"
- Team: 4 members
  - M1 = Ahmed (Bob/DX Lead + Team Lead)
  - M2 = Backend Lead
  - M3 = Frontend Owner
  - M4 = AI/Integrations Lead
- Single source of truth: docs/PLAN.md
- Frozen API contract: docs/CONTRACTS.md

TECH STACK
- Backend: Python 3.11 / FastAPI / MCP SDK / SQLite + sqlite-vec / watsonx.ai
- Frontend: React + Vite + TypeScript / Carbon Design System (fallback: shadcn/ui)
- Mobile capture: python-telegram-bot / watsonx.ai STT (fallback: Whisper.cpp)
- Bob extensions: YAML manifests + Markdown skills (no code, just config)
- Containers: Dockerfile per service, docker-compose.yml at repo root
- API listens on port 8080

REPO STRUCTURE
- cortex-api/      Python MCP server + REST API (port 8080)
- cortex-web/      React UI (port 8081)
- cortex-bot/      Telegram bot
- bob/             Bob extension manifests (mode, skill, slash commands, rules)
- docs/            PLAN.md, CONTRACTS.md, SUBMISSION.md, BOB_USAGE.md, etc.
- tests/           pytest

GROUND RULES (these override your defaults)
1. READ docs/PLAN.md and docs/CONTRACTS.md before any change to API surface, schema, or shared types.
2. NEVER commit secrets, API keys, tokens, or .env files. Bob's secret-detection should refuse them.
3. NEVER claim that you (this AI agent) are IBM Bob. NEVER log work to docs/BOB_USAGE.md - that ledger is Bob-only.
4. BRANCH FIRST: create feat/<short-name> from dev. Push to that branch. Open PR to dev (NOT to main).
5. MATCH existing patterns. If unsure, ask before introducing a new abstraction or dependency.
6. GENERATE pytest tests for any new backend logic. Use vitest+RTL for frontend.
7. TEST with `docker compose up` before opening the PR (where applicable).
8. PR title format: `[area] short verb-led description`
   Example: `[backend] persist entries with sqlite-vec`
9. PR body MUST include:
   - What changed
   - How to test (commands)
   - Linked Trello card URL
   - Whether Bob was used (it should NOT be — this prompt is for non-Bob agents)
10. NO third-party code without commercial-friendly license (MIT, Apache-2.0, BSD).
    Anything you copy from Stack Overflow, GitHub, or paste from elsewhere must be cited
    and license-checked. The submission grants IBM a perpetual license to the code.

YOUR TASK
[paste the specific task here — be precise. Include:
  - branch name
  - files to touch
  - acceptance criteria
  - relevant doc section to read first]
```

## Examples — good vs. bad task descriptions

**❌ Bad** (vague, no acceptance criteria):
> "build the timeline page"

**✅ Good** (specific, testable):
> "On branch `feat/web-timeline`, implement `cortex-web/src/pages/Timeline.tsx`. Hits `GET /api/v1/entries?limit=20` (see `docs/CONTRACTS.md`). Renders a Carbon `StructuredList` of entries showing source badge, created_at (relative), and first 200 chars. Implement loading / empty / error states. Acceptance: lints clean, vitest passes, manually verified at http://localhost:8081/timeline with mock data, PR opened to `dev`."

**❌ Bad**:
> "fix the search"

**✅ Good**:
> "On branch `fix/search-empty-query`, in `cortex-api/cortex_api/retrieval.py`, the `recall(query, k)` function 500s when `query` is empty. Should return `{entries: []}` with HTTP 200. Add a pytest case `test_recall_empty_query_returns_empty`. Acceptance: pytest green, no other behaviour changes."

## When to abandon this prompt and use Bob instead

Use Bob (not this agent) when the task is:
- Refactoring a finished module into cleaner shape (Bob's strength + judge-visible)
- Generating a test suite from scratch
- Secret/security scan of the repo
- Generating a Bob extension manifest (mode, skill, rules) — meta but valuable
- The live demo session (one designated session per the plan)

Each Bob session must be exported and logged in `docs/BOB_USAGE.md` per the rules.
