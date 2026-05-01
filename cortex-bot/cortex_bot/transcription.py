"""Voice → text transcription.

Phase 2 (M4): replace the stub with either:
  - whisper.cpp local (fast, free, offline)
  - watsonx.ai STT (showcases IBM tech; primary for the demo)
"""

from __future__ import annotations

from cortex_bot.config import settings


async def transcribe(audio_bytes: bytes, mime: str = "audio/ogg") -> str:
    """Return the transcript of ``audio_bytes`` or a placeholder.

    Phase 0 stub: returns an obvious placeholder so the rest of the bot can be
    wired without a working STT provider yet.
    """

    # TODO(M4 Phase 2): implement based on settings.transcription_provider
    return "[transcription pending — STT provider not yet wired]"
