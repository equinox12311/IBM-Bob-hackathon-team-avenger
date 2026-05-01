"""Lightweight client-side secret check.

Server-side detection in ``cortex-api`` is the authoritative gatekeeper, but a
fast local check lets the bot tell the user *before* paying for the round-trip
and avoids leaking the secret to any logs along the way.
"""

from __future__ import annotations

import re

_QUICK_PATTERNS = [
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(r"\bghp_[A-Za-z0-9]{36}\b"),
    re.compile(r"\bgithub_pat_[A-Za-z0-9_]{60,}"),
    re.compile(r"\bsk-[A-Za-z0-9]{20,}\b"),
    re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}"),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    re.compile(r"\beyJ[A-Za-z0-9_=-]{10,}\.[A-Za-z0-9_=-]{10,}\.[A-Za-z0-9_=-]+"),
]


def looks_like_secret(text: str) -> bool:
    return any(p.search(text) for p in _QUICK_PATTERNS)
