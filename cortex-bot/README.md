# cortex-bot

Telegram bot — mobile capture surface for Cortex. Owned by **M4**.

- Accepts **text** and **voice** messages from allowlisted Telegram user IDs
- Voice → transcript via watsonx.ai STT (or whisper.cpp local fallback) → POST to `cortex-api`
- `/recall <topic>` — semantic search via cortex-api
- `/timeline` — recent entries

## Run locally

```bash
cd cortex-bot
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env       # set TELEGRAM_BOT_TOKEN, DIARY_TOKEN, allowlist
python -m cortex_bot
```

## Run via Docker

From the repo root:

```bash
docker compose up bot
```

The bot polls Telegram (long polling) — no port to expose.

## Get a Telegram bot token

1. Open Telegram, message `@BotFather`
2. `/newbot`, follow prompts
3. Copy the token into `.env` as `TELEGRAM_BOT_TOKEN`
4. Find your own user ID via `@userinfobot` and put it in `TELEGRAM_ALLOWLIST_USER_IDS`

## Phase 1 work (M4)

1. Bot skeleton echoes text (skeleton already wires save_entry — verify with the API up)
2. Voice handler: download `.ogg`, pass to `transcribe()` (currently stubbed)
3. Allowlist enforcement (already in `_allowed()`)

## Phase 2/3 work (M4)

- Wire watsonx.ai STT in `transcription.py`
- Secret-detection middleware (refuse to save text matching AWS keys / GH tokens / JWTs)
- Refactor + integration tests (Bob session)

## Phase 4 (M4)

- Record the iPhone-screen demo of Telegram capture → web UI
- Export Bob session report
