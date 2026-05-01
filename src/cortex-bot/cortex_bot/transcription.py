"""Voice → text transcription.

Two providers in priority order:

1. **IBM Speech to Text** (when ``ibm_stt_apikey`` + ``ibm_stt_url`` are set in
   ``.env``) — preferred for the IBM ecosystem story.
2. **faster-whisper** local fallback — always works, no credentials, runs on CPU.

Audio in is bytes (Telegram OGG/Opus). We write a temp file because both
providers expect file paths. The temp file is deleted after transcription.
"""

from __future__ import annotations

import logging
import tempfile
from pathlib import Path
from typing import Protocol

from cortex_bot.config import settings

log = logging.getLogger(__name__)


class _Transcriber(Protocol):
    def transcribe(self, audio_path: Path) -> str: ...


# ---------- providers ------------------------------------------------------


class IBMSpeechToText:
    """IBM Speech to Text via the ``ibm-watson`` SDK."""

    def __init__(self, apikey: str, url: str) -> None:
        from ibm_cloud_sdk_core.authenticators import IAMAuthenticator  # type: ignore[import-not-found]
        from ibm_watson import SpeechToTextV1  # type: ignore[import-not-found]

        authenticator = IAMAuthenticator(apikey)
        self._client = SpeechToTextV1(authenticator=authenticator)
        self._client.set_service_url(url)

    def transcribe(self, audio_path: Path) -> str:
        with audio_path.open("rb") as fh:
            resp = self._client.recognize(
                audio=fh,
                content_type="audio/ogg;codecs=opus",
                model="en-US_BroadbandModel",
            ).get_result()
        chunks = [
            r["alternatives"][0]["transcript"]
            for r in resp.get("results", [])
            if r.get("alternatives")
        ]
        return " ".join(chunks).strip()


class WhisperLocal:
    """faster-whisper running on CPU. Loads the model lazily on first call."""

    _model = None

    def transcribe(self, audio_path: Path) -> str:
        from faster_whisper import WhisperModel  # type: ignore[import-not-found]

        if WhisperLocal._model is None:
            log.info("Loading faster-whisper base model (one-time)")
            WhisperLocal._model = WhisperModel("base", device="cpu", compute_type="int8")
        segments, _info = WhisperLocal._model.transcribe(str(audio_path), beam_size=1)
        return " ".join(s.text for s in segments).strip()


# ---------- public API -----------------------------------------------------


def _build_transcriber() -> _Transcriber | None:
    if settings.transcription_provider == "watsonx-stt":
        api = getattr(settings, "ibm_stt_apikey", "")
        url = getattr(settings, "ibm_stt_url", "")
        if api and url:
            try:
                return IBMSpeechToText(api, url)
            except Exception as exc:  # noqa: BLE001
                log.warning("IBM STT init failed (%s); falling back", exc)
    try:
        return WhisperLocal()
    except Exception as exc:  # noqa: BLE001 — keep bot running
        log.warning("Whisper init failed (%s); transcription disabled", exc)
        return None


_TRANSCRIBER: _Transcriber | None = None


async def transcribe(audio_bytes: bytes, mime: str = "audio/ogg") -> str:
    """Return the transcript of ``audio_bytes`` or a placeholder on failure."""

    global _TRANSCRIBER
    if _TRANSCRIBER is None:
        _TRANSCRIBER = _build_transcriber()
    if _TRANSCRIBER is None:
        return "[transcription failed: no provider available]"

    suffix = ".ogg" if "ogg" in mime else ".audio"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        path = Path(tmp.name)
    try:
        text = _TRANSCRIBER.transcribe(path)
        return text or "[transcription empty]"
    except Exception as exc:  # noqa: BLE001
        log.exception("transcription failed")
        return f"[transcription failed: {exc}]"
    finally:
        path.unlink(missing_ok=True)
