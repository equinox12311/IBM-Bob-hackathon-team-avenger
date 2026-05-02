# Cortex Security Documentation

This directory contains all security-related documentation for the Cortex Developer Journal.

## Documents

| File | Description |
|---|---|
| [`THREAT_MODEL.md`](THREAT_MODEL.md) | STRIDE threat analysis, attack scenarios, mitigations, residual risks |
| [`SECURITY_GUIDELINES.md`](SECURITY_GUIDELINES.md) | Secure coding practices, code review checklist, common vulnerability patterns |
| [`SECURITY_REMEDIATION_PLAN.md`](SECURITY_REMEDIATION_PLAN.md) | Phased OWASP remediation plan with implementation status |

## Implementation Status

### ✅ Fully Implemented

| Feature | Layer | File(s) |
|---|---|---|
| Bearer token authentication | Backend | `cortex_api/auth.py` |
| Secret detection (11 patterns + entropy) | Backend | `cortex_api/secrets.py` |
| CORS tightening (production) | Backend | `cortex_api/server.py` |
| Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS) | Backend | `cortex_api/server.py` |
| Server-side rate limiting (per-IP sliding window) | Backend | `cortex_api/server.py` |
| Pydantic input validation | Backend | `cortex_api/models.py` |
| Token encryption (XOR + browser fingerprint) | Frontend | `src/lib/crypto.ts` |
| Content Security Policy (CSP) | Frontend | `index.html` |
| Security headers (X-Frame-Options, etc.) | Frontend | `vite.config.ts` |
| Input validation (query, entry ID, API URL, text) | Frontend | `src/lib/validation.ts` |
| Error message sanitization (production) | Frontend | `src/lib/validation.ts`, `src/api/client.ts` |
| CSRF token generation + injection | Frontend | `src/lib/csrf.ts`, `src/api/client.ts` |
| CSRF lifecycle (regenerate on login, clear on logout) | Frontend | `src/hooks/useAuth.tsx` |
| Client-side rate limiting (sliding window) | Frontend | `src/lib/rateLimit.ts` |
| Token validation on login | Frontend | `src/pages/Login.tsx` |
| URL validation on settings save | Frontend | `src/pages/Settings.tsx` |
| Search query validation + rate limiting | Frontend | `src/pages/Search.tsx` |
| Command palette query validation | Frontend | `src/components/CommandPalette.tsx` |
| Entry ID validation | Frontend | `src/pages/EntryDetail.tsx` |
| Client-side secret guard | Bot | `cortex_bot/secret_guard.py` |

### ⚠️ Partially Implemented / Future Work

| Feature | Status | Notes |
|---|---|---|
| Token storage | Partial | XOR cipher (obfuscation, not encryption). Future: httpOnly cookies |
| CSRF server-side validation | Partial | Client sends header; server does not yet validate it |
| Audit logging | TODO | No request/response audit trail |
| Session timeout | TODO | Tokens are long-lived |
| Server-side CSRF validation | TODO | Client sends `X-CSRF-Token`; backend ignores it |
| Anomaly detection | TODO | Unusual access patterns not detected |
| MFA | TODO | Single factor only |

## Quick Reference

### Running Security Tests

```bash
# Backend security tests
PYTHONPATH=src/cortex-api .venv/Scripts/python.exe -m pytest tests/test_secrets.py tests/test_security_phase2.py -v

# All tests
PYTHONPATH=src/cortex-api .venv/Scripts/python.exe -m pytest tests/ -v
```

### Security Headers Verified

The backend now sets these headers on every response:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
Strict-Transport-Security: max-age=31536000; includeSubDomains  (production only)
```

### Rate Limits (Server-Side)

| Endpoint | Limit |
|---|---|
| All endpoints | 60 req/min per IP |
| `POST /api/v1/entries` | 20 req/min per IP |
| `GET /api/v1/search` | 30 req/min per IP |
| `POST /api/v1/chat` | 10 req/min per IP |

### Rate Limits (Client-Side)

| Operation | Limit |
|---|---|
| Search | 10 req/min |
| API calls | 30 req/min |
| Entry creation | 5 req/min |
| Settings updates | 3 req/min |

## OWASP Top 10 Coverage

| # | Vulnerability | Status |
|---|---|---|
| A01 | Broken Access Control | ✅ Bearer token on all endpoints |
| A02 | Cryptographic Failures | ✅ Token encrypted at rest (weak cipher — see notes) |
| A03 | Injection | ✅ Pydantic validation + parameterized queries |
| A04 | Insecure Design | ✅ Threat model documented |
| A05 | Security Misconfiguration | ✅ CORS tightened, security headers added |
| A06 | Vulnerable Components | ⚠️ Dependency scanning recommended |
| A07 | Authentication Failures | ✅ Token validation, rate limiting |
| A08 | Software/Data Integrity | ⚠️ No audit logging yet |
| A09 | Logging Failures | ⚠️ No structured security logging |
| A10 | SSRF | N/A — no outbound requests from backend |

Made with Bob
