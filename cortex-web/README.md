# cortex-web

React + Vite + TypeScript UI with **IBM Carbon Design System**. Owned by **M3**.

## Run locally

```bash
cd cortex-web
npm install        # or pnpm install
cp .env.example .env
npm run dev        # opens on http://localhost:5173
```

The dev server proxies API calls to `VITE_API_BASE_URL` (default `http://localhost:8080`).

## Run via Docker

From the repo root:

```bash
docker compose up web    # served on http://localhost:8081
```

## Pages

- `/login` — mock token entry (paste `DIARY_TOKEN`)
- `/timeline` — reverse-chron list of entries
- `/search` — semantic search
- `/entry/:id` — entry detail + feedback (👍/👎)
- `/settings` — config

## Phase 1 work (M3)

1. `App.tsx` shell + Carbon `Header` (done in skeleton — verify it renders)
2. Mock login screen (done — try it with any token; backend isn't enforcing yet)
3. Timeline page hits `GET /api/v1/entries` (skeleton hooks the API; need backend live for real data)
4. Loading + empty + error states

## Phase 3 work (M3)

- Wire `EntryDetail` (`GET /api/v1/entries/:id` once added to backend)
- Search page: results polish, snippet highlighting
- Settings: persist `VITE_API_BASE_URL` overrides to localStorage
- ⌘K command palette (nice-to-have)
- Mobile-responsive pass

## Pairing protocol

The plan calls for paired sessions with M2 at Hour 16 (real API hookup) and M1 at Hour 24 (UX review). Schedule those on the kickoff call.
