"""Telegram message handlers for cortex-bot."""

from __future__ import annotations

import logging

from telegram import Update
from telegram.ext import ContextTypes

from cortex_bot.api_client import save_entry, search, timeline
from cortex_bot.config import settings
from cortex_bot.transcription import transcribe

log = logging.getLogger(__name__)


def _allowed(update: Update) -> bool:
    if not update.effective_user:
        return False
    allow = settings.allowlist_ids
    if not allow:
        return True  # no allowlist = everyone (dev mode)
    return update.effective_user.id in allow


async def on_text(update: Update, _ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not _allowed(update) or not update.message or not update.message.text:
        return
    text = update.message.text.strip()
    if not text:
        return
    try:
        res = await save_entry(text=text, source="telegram-text")
        await update.message.reply_text(f"📓 saved (#{res['id']})")
    except Exception as exc:  # noqa: BLE001 — surface to user during demo
        log.exception("save_entry failed")
        await update.message.reply_text(f"⚠️ save failed: {exc}")


async def on_voice(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not _allowed(update) or not update.message or not update.message.voice:
        return
    voice = update.message.voice
    file = await ctx.bot.get_file(voice.file_id)
    audio = await file.download_as_bytearray()
    transcript = await transcribe(bytes(audio))
    res = await save_entry(text=transcript, source="telegram-voice")
    await update.message.reply_text(f"📓 saved voice memo (#{res['id']})\n\n{transcript}")


async def cmd_recall(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not _allowed(update) or not update.message:
        return
    query = " ".join(ctx.args) if ctx.args else ""
    if not query:
        await update.message.reply_text("Usage: /recall <topic>")
        return
    res = await search(query, k=3)
    entries = res.get("entries", [])
    if not entries:
        await update.message.reply_text("nothing matches yet.")
        return
    lines = [f"#{e['id']} ({e['source']}): {e['text'][:200]}" for e in entries]
    await update.message.reply_text("\n\n".join(lines))


async def cmd_timeline(update: Update, _ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not _allowed(update) or not update.message:
        return
    res = await timeline(limit=5)
    entries = res.get("entries", [])
    if not entries:
        await update.message.reply_text("no entries yet.")
        return
    lines = [f"#{e['id']} ({e['source']}): {e['text'][:120]}" for e in entries]
    await update.message.reply_text("\n\n".join(lines))


async def cmd_start(update: Update, _ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    await update.message.reply_text(
        "📓 Cortex bot online.\n"
        "Send me text or a voice memo to capture.\n"
        "Use /recall <topic> to search, /timeline for recent entries."
    )
