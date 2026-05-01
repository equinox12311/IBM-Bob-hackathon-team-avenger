"""Secret detection — refuse to persist text that looks like credentials.

Used both by the REST endpoint middleware and by the MCP tool layer so the
secret never lands in the diary regardless of how it was submitted.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from typing import NamedTuple

# Each pattern → (label, compiled regex). Order matters only for first-match
# reporting; we test all of them anyway.
_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("AWS access key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("AWS secret key", re.compile(r"(?i)aws_secret[_-]?access[_-]?key[\"'\s:=]+([A-Za-z0-9/+=]{40})")),
    ("GitHub PAT (classic)", re.compile(r"\bghp_[A-Za-z0-9]{36}\b")),
    ("GitHub PAT (fine-grained)", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{60,}")),
    ("GitHub OAuth token", re.compile(r"\bgho_[A-Za-z0-9]{36}\b")),
    ("Slack bot token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}")),
    ("OpenAI API key", re.compile(r"\bsk-[A-Za-z0-9]{20,}\b")),
    ("Stripe key", re.compile(r"\b(sk|pk)_(test|live)_[A-Za-z0-9]{20,}\b")),
    ("JWT", re.compile(r"\beyJ[A-Za-z0-9_=-]{10,}\.[A-Za-z0-9_=-]{10,}\.[A-Za-z0-9_=-]+\b")),
    ("Private key block", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("Generic password assignment", re.compile(r"(?i)\b(password|passwd|pwd)\s*[:=]\s*[\"']?[^\s\"']{8,}")),
]

# A high-entropy "token-like" string heuristic — catches things the patterns miss.
_TOKEN_LIKE = re.compile(r"\b[A-Za-z0-9+/_=-]{32,}\b")


class SecretFinding(NamedTuple):
    label: str
    snippet: str


def _shannon_entropy(s: str) -> float:
    if not s:
        return 0.0
    counts = Counter(s)
    total = len(s)
    return -sum((c / total) * math.log2(c / total) for c in counts.values())


def detect_secrets(text: str) -> list[SecretFinding]:
    """Return all matches; empty list = clean."""

    findings: list[SecretFinding] = []
    for label, pattern in _PATTERNS:
        for match in pattern.finditer(text):
            snippet = match.group(0)
            findings.append(SecretFinding(label=label, snippet=_redact(snippet)))

    # High-entropy fallback: only flag if the string also doesn't look like a
    # natural-language sentence (no spaces, mostly url-safe alnum, entropy > 4.5)
    for match in _TOKEN_LIKE.finditer(text):
        token = match.group(0)
        if " " in token:  # impossible by regex but cheap guard
            continue
        if _shannon_entropy(token) >= 4.5:
            findings.append(
                SecretFinding(
                    label="High-entropy token (possible secret)",
                    snippet=_redact(token),
                )
            )

    # Deduplicate while preserving order
    seen: set[tuple[str, str]] = set()
    unique: list[SecretFinding] = []
    for f in findings:
        key = (f.label, f.snippet)
        if key not in seen:
            seen.add(key)
            unique.append(f)
    return unique


def _redact(snippet: str) -> str:
    """Show only first/last 3 chars of a possible secret in error messages."""

    if len(snippet) <= 8:
        return "<redacted>"
    return f"{snippet[:3]}…{snippet[-3:]}"
