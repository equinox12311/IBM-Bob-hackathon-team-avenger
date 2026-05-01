"""Bot bootstrap — wires handlers and starts polling Telegram."""

from __future__ import annotations

import logging

from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    filters,
)

from cortex_bot.config import settings
from cortex_bot.handlers import (
    cmd_help,
    cmd_recall,
    cmd_start,
    cmd_timeline,
    on_text,
    on_voice,
)


def run() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    if not settings.telegram_bot_token:
        raise SystemExit(
            "TELEGRAM_BOT_TOKEN is empty. Get one from @BotFather and put it in .env."
        )

    app = ApplicationBuilder().token(settings.telegram_bot_token).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("recall", cmd_recall))
    app.add_handler(CommandHandler("search", cmd_recall))  # alias
    app.add_handler(CommandHandler("timeline", cmd_timeline))
    app.add_handler(MessageHandler(filters.VOICE, on_voice))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_text))

    logging.info(
        "cortex-bot online (api=%s, transcription=%s); press Ctrl-C to stop",
        settings.api_base_url,
        settings.transcription_provider,
    )
    app.run_polling(allowed_updates=["message"])
