# cortex-web · ⚠️ legacy demo surface

> **The primary client is now [`cortex-mobile/`](../../cortex-mobile/) — a full Expo app for iOS, Android, and Web.**
> This Vite+React UI is kept as a reference / fallback web client and is not the focus of demos.

React + Vite + TypeScript UI with **IBM Carbon Design System**. Originally owned by **M3 (Frontend)** in v0.1; superseded by the Expo mobile app in v0.3.

## When to use this

- You want a quick browser demo without installing Expo Go
- You're debugging a backend endpoint and want a familiar React UI
- You're showing the page-by-page Carbon styling for the design audit

For everything else — **demos, judges, day-to-day usage** — run `cortex-mobile`.

## Run locally

```bash
cd src/cortex-web
npm install        # or pnpm install
cp .env.example .env
npm run dev        # opens on http://localhost:5173
```

The dev server proxies API calls to `VITE_API_BASE_URL` (default `http://localhost:8080`).

## Pages

- `/login` — mock token entry (paste `DIARY_TOKEN`)
- `/today` — dashboard
- `/timeline` — reverse-chron list of entries
- `/search` — semantic search
- `/entry/:id` — entry detail + feedback (👍/👎)
- `/ideas` · `/debug` · `/report` · `/analytics` · `/productivity` · `/github` · `/automations` · `/wellness` · `/identity` · `/news` · `/profile` · `/settings`

All of these have a mobile equivalent in `cortex-mobile/app/`.

## Deprecation notes

- Future feature work lands in `cortex-mobile/` first
- Bug-fix-only commits OK here so judges who run the web client still see something working
- Do **not** add new pages here without porting to mobile in the same PR
