"""Telegram message handlers for cortex-bot."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Iterable

from telegram import Update
from telegram.ext import ContextTypes

from cortex_bot.api_client import save_entry, search, timeline
from cortex_bot.config import settings
from cortex_bot.secret_guard import looks_like_secret
from cortex_bot.transcription import transcribe

log = logging.getLogger(__name__)


# ---------- helpers --------------------------------------------------------


def _allowed(update: Update) -> bool:
    if not update.effective_user:
        return False
    allow = settings.allowlist_ids
    if not allow:
        return True  # no allowlist = everyone (dev mode)
    return update.effective_user.id in allow


def _format_entries(entries: Iterable[dict]) -> str:
    blocks = []
    for e in entries:
        ts = datetime.fromtimestamp(e["created_at"] / 1000, tz=timezone.utc)
        rel = ts.strftime("%Y-%m-%d %H:%M UTC")
        location = ""
        if e.get("file"):
            line = ""
            if e.get("line_start"):
                line = f":{e['line_start']}"
                if e.get("line_end") and e["line_end"] != e["line_start"]:
                    line += f"-{e['line_end']}"
            location = f"\n📍 {e['file']}{line}"
        blocks.append(
            f"#{e['id']} ({e['source']}) · {rel}{location}\n{e['text']}"
        )
    return "\n\n———\n\n".join(blocks) if blocks else "(no results)"


# ---------- handlers -------------------------------------------------------


async def on_text(update: Update, _ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not _allowed(update) or not update.message or not update.message.text:
        return
    text = update.message.text.strip()
    if not text:
        return
    if looks_like_secret(text):
        await update.message.reply_text(
            "⚠️ Refused to save: that text looks like it contains a secret "
            "(API key, token, or private key). Redact and try again."
        )
        return
    try:
        res = await save_entry(text=text, source="telegram-text")
        await update.message.reply_text(f"📓 saved (#{res['id']})")
    except Exception as exc:  # noqa: BLE001
        log.exception("save_entry failed")
        await update.message.reply_text(f"⚠️ save failed: {exc}")


async def on_voice(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not _allowed(update) or not update.message or not update.message.voice:
        return
    voice = update.message.voice
    await update.message.reply_text("🎙️ transcribing…")
    try:
        file = await ctx.bot.get_file(voice.file_id)
        audio = await file.download_as_bytearray()
    except Exception as exc:  # noqa: BLE001
        await update.message.reply_text(f"⚠️ couldn't download voice: {exc}")
        return

    transcript = await transcribe(bytes(audio))

    if not transcript or transcript.startswith("[transcription"):
        await update.message.reply_text(transcript or "[empty transcript]")
        return

    if looks_like_secret(transcript):
        await update.message.reply_text(
            "⚠️ Transcript looks like it contains a secret — not saving."
        )
        return

    try:
        res = await save_entry(text=transcript, source="telegram-voice")
        await update.message.reply_text(
            f"📓 saved voice memo (#{res['id']})\n\n{transcript}"
        )
    except Exception as exc:  # noqa: BLE001
        log.exception("save_entry (voice) failed")
        await update.message.reply_text(f"⚠️ save failed: {exc}\n\n{transcript}")


async def cmd_recall(update: Update, ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not _allowed(update) or not update.message:
        return
    query = " ".join(ctx.args) if ctx.args else ""
    if not query:
        await update.message.reply_text("Usage: /recall <topic>")
        return
    try:
        res = await search(query, k=3)
    except Exception as exc:  # noqa: BLE001
        await update.message.reply_text(f"⚠️ recall failed: {exc}")
        return
    entries = res.get("entries", [])
    if not entries:
        await update.message.reply_text("nothing matches yet.")
        return
    await update.message.reply_text(_format_entries(entries))


async def cmd_timeline(update: Update, _ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not _allowed(update) or not update.message:
        return
    try:
        res = await timeline(limit=5)
    except Exception as exc:  # noqa: BLE001
        await update.message.reply_text(f"⚠️ timeline failed: {exc}")
        return
    entries = res.get("entries", [])
    if not entries:
        await update.message.reply_text("no entries yet.")
        return
    await update.message.reply_text(_format_entries(entries))


async def cmd_start(update: Update, _ctx: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    await update.message.reply_text(
        "📓 *Cortex bot online.*\n\n"
        "Send me text or a voice memo to capture an insight.\n"
        "Commands:\n"
        "  /recall <topic> — semantic search\n"
        "  /timeline — recent entries\n"
        "  /help — this message\n\n"
        "Voice messages are transcribed (IBM STT or local Whisper).\n"
        "Anything that looks like an API key / token will be refused.",
        parse_mode="Markdown",
    )


# alias
cmd_help = cmd_start
