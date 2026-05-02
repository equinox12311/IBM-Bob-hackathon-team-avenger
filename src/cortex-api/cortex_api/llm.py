"""LLM provider abstraction for Cortex.

Two providers — both IBM Granite, same model family across local and cloud:

  • WatsonxLLM  → ``ibm/granite-3-8b-instruct`` via the watsonx.ai SDK
  • LocalLLM    → ``granite-3.1-2b-instruct`` (Q4_K_M GGUF) via llama-cpp-python

Switch with ``LLM_PROVIDER=watsonx | local | off`` in ``.env``.
``off`` makes the runtime gracefully decline LLM-powered endpoints with 503.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from functools import lru_cache
from typing import Iterable

from cortex_api.config import settings

log = logging.getLogger(__name__)


@dataclass
class Message:
    role: str  # "system" | "user" | "assistant"
    content: str


class LLMProvider(ABC):
    name: str

    @abstractmethod
    def complete(
        self,
        messages: list[Message],
        max_tokens: int = 512,
        temperature: float = 0.3,
    ) -> str:
        """Return a single completion for ``messages``."""


# ---------- watsonx.ai Granite ---------------------------------------------


class WatsonxLLM(LLMProvider):
    name = f"watsonx:{settings.watsonx_llm_model}"

    def __init__(self) -> None:
        if not settings.watsonx_api_key or not settings.watsonx_project_id:
            raise RuntimeError(
                "watsonx LLM credentials missing — set WATSONX_API_KEY and "
                "WATSONX_PROJECT_ID, or set LLM_PROVIDER=local"
            )
        from ibm_watsonx_ai import Credentials  # type: ignore[import-not-found]
        from ibm_watsonx_ai.foundation_models import ModelInference  # type: ignore[import-not-found]

        log.info("Initialising watsonx.ai LLM (model=%s)", settings.watsonx_llm_model)
        self._creds = Credentials(api_key=settings.watsonx_api_key, url=settings.watsonx_url)
        self._client = ModelInference(
            model_id=settings.watsonx_llm_model,
            credentials=self._creds,
            project_id=settings.watsonx_project_id,
        )

    def complete(
        self,
        messages: list[Message],
        max_tokens: int = 512,
        temperature: float = 0.3,
    ) -> str:
        try:
            res = self._client.chat(
                messages=[{"role": m.role, "content": m.content} for m in messages],
                params={
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                },
            )
            return res["choices"][0]["message"]["content"]  # type: ignore[index]
        except Exception:
            # Some watsonx-ai versions use generate_text_with_chat or similar;
            # fall back to a flat prompt to avoid hard-coupling to one API.
            prompt = _flatten(messages)
            res = self._client.generate_text(
                prompt=prompt,
                params={
                    "decoding_method": "greedy" if temperature == 0 else "sample",
                    "max_new_tokens": max_tokens,
                    "temperature": temperature,
                },
            )
            return str(res).strip()


# ---------- local Granite via llama-cpp-python -----------------------------


class LocalLLM(LLMProvider):
    name = "local:granite-3.1-2b-instruct"

    def __init__(self) -> None:
        gguf_path = settings.local_llm_gguf_path
        if not gguf_path.exists():
            raise RuntimeError(
                f"GGUF model not found at {gguf_path}. Download with:\n"
                f"  huggingface-cli download ibm-granite/granite-3.1-2b-instruct-GGUF \\\n"
                f"    granite-3.1-2b-instruct-Q4_K_M.gguf -d models/"
            )
        from llama_cpp import Llama  # type: ignore[import-not-found]

        log.info("Loading local Granite GGUF (%s)", gguf_path)
        self._llm = Llama(
            model_path=str(gguf_path),
            n_ctx=settings.local_llm_n_ctx,
            n_threads=settings.local_llm_n_threads or None,
            verbose=False,
        )

    def complete(
        self,
        messages: list[Message],
        max_tokens: int = 512,
        temperature: float = 0.3,
    ) -> str:
        # Granite chat templates accept the standard {role, content} shape.
        res = self._llm.create_chat_completion(
            messages=[{"role": m.role, "content": m.content} for m in messages],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return res["choices"][0]["message"]["content"].strip()


# ---------- public ----------------------------------------------------------


class _NoLLM(LLMProvider):
    name = "off"

    def complete(self, messages: list[Message], max_tokens: int = 512, temperature: float = 0.3) -> str:
        raise RuntimeError(
            "LLM_PROVIDER is 'off' — set it to 'watsonx' or 'local' in .env "
            "to enable LLM-backed endpoints."
        )


@lru_cache(maxsize=1)
def get_provider() -> LLMProvider:
    p = settings.llm_provider
    if p == "watsonx":
        try:
            return WatsonxLLM()
        except Exception as exc:  # noqa: BLE001 — fall back gracefully
            log.warning("watsonx LLM unavailable (%s); attempting local fallback", exc)
    if p == "local" or p == "watsonx":
        try:
            return LocalLLM()
        except Exception as exc:  # noqa: BLE001
            log.warning("Local LLM unavailable (%s); LLM endpoints will return 503", exc)
    return _NoLLM()


def is_available() -> bool:
    return not isinstance(get_provider(), _NoLLM)


# ---------- helpers ---------------------------------------------------------


def _flatten(messages: Iterable[Message]) -> str:
    """Fallback prompt format for older watsonx APIs."""

    parts = []
    for m in messages:
        prefix = {"system": "<|system|>", "user": "<|user|>", "assistant": "<|assistant|>"}.get(
            m.role, f"<|{m.role}|>"
        )
        parts.append(f"{prefix}\n{m.content}")
    parts.append("<|assistant|>\n")
    return "\n".join(parts)
