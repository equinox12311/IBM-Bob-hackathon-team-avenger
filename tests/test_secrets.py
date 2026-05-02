"""Unit tests for cortex_api.secrets.detect_secrets."""

from __future__ import annotations

import pytest


@pytest.fixture
def detect():
    from cortex_api.secrets import detect_secrets

    return detect_secrets


def test_clean_text_returns_no_findings(detect):
    assert detect("just a normal note about postgres connection pooling") == []


@pytest.mark.parametrize(
    "needle,label_substr",
    [
        ("AKIAIOSFODNN7EXAMPLE",                           "AWS access key"),
        ("ghp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",       "GitHub PAT (classic)"),
        ("github_pat_" + "A" * 80,                          "GitHub PAT"),
        ("xoxb-1234567890-abcdefghij",                     "Slack bot token"),
        ("sk-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",           "OpenAI API key"),
        ("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSJ9.signature_xx",  "JWT"),
        ("-----BEGIN RSA PRIVATE KEY-----",                "Private key block"),
    ],
)
def test_each_pattern_is_caught(detect, needle, label_substr):
    findings = detect(f"some text and the secret is {needle} okay bye")
    labels = [f.label for f in findings]
    assert any(label_substr in lbl for lbl in labels), (labels, needle)


def test_high_entropy_token_caught_as_fallback(detect):
    # 40 random-looking chars — long enough to flag and high-entropy
    suspicious = "Z9aQ3mPkR8tYsW2bVxN5cD7fGhJ4lKwEoUiAqMxV"
    findings = detect(f"my new credential: {suspicious}")
    assert any("High-entropy" in f.label for f in findings)


def test_snippet_is_redacted(detect):
    findings = detect("token AKIAIOSFODNN7EXAMPLE here")
    assert findings
    # The snippet should not contain the full secret
    for f in findings:
        assert "EXAMPLE" not in f.snippet
        assert "AKIAIOSFODNN" not in f.snippet
        assert "…" in f.snippet or f.snippet == "<redacted>"


def test_dedupes_same_finding(detect):
    findings = detect("AKIAIOSFODNN7EXAMPLE AKIAIOSFODNN7EXAMPLE")
    aws_findings = [f for f in findings if "AWS" in f.label]
    assert len(aws_findings) == 1
