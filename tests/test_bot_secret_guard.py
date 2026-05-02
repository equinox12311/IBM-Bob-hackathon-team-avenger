"""Unit tests for cortex_bot.secret_guard.

The bot's quick-check is a thinner version of cortex_api.secrets — it must
catch the most common offenders without false-positiving on prose.
"""

from __future__ import annotations

import pytest


@pytest.fixture
def guard():
    from cortex_bot.secret_guard import looks_like_secret

    return looks_like_secret


def test_clean_text_passes(guard):
    assert not guard("just a normal note about the deployment")


@pytest.mark.parametrize(
    "needle",
    [
        "AKIAIOSFODNN7EXAMPLE",
        "ghp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "github_pat_" + "A" * 80,
        "sk-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "xoxb-1234567890-abcdefghij",
        "-----BEGIN OPENSSH PRIVATE KEY-----",
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSJ9.signature_xx",
    ],
)
def test_known_secret_patterns_caught(guard, needle):
    assert guard(f"context {needle} more context")


def test_low_entropy_strings_pass(guard):
    # Long alphabetic prose should NOT trigger
    sentence = "The quick brown fox jumps over the lazy dog while " * 4
    assert not guard(sentence)
