# Threat Model - Cortex Developer Journal

**Version:** 1.0  
**Last Updated:** 2026-05-02  
**Status:** Active

---

## Executive Summary

This document identifies potential security threats to the Cortex Developer Journal application and outlines mitigation strategies. The application handles sensitive developer knowledge and requires protection against common web application vulnerabilities.

---

## System Overview

### Architecture
- **Frontend:** React/TypeScript SPA (Vite)
- **Backend:** FastAPI (Python)
- **Database:** SQLite with vector extensions
- **Authentication:** Bearer token (stored encrypted)
- **Deployment:** Docker containers

### Data Classification
- **Critical:** Authentication tokens, API keys
- **Sensitive:** Developer journal entries, code snippets
- **Public:** Application metadata, health endpoints

---

## Threat Actors

### 1. External Attackers
**Motivation:** Data theft, service disruption  
**Capabilities:** Network access, automated tools  
**Likelihood:** Medium

### 2. Malicious Insiders
**Motivation:** Data exfiltration, sabotage  
**Capabilities:** Legitimate access, system knowledge  
**Likelihood:** Low

### 3. Accidental Misuse
**Motivation:** None (unintentional)  
**Capabilities:** Normal user access  
**Likelihood:** High

---

## Threat Categories (STRIDE)

### Spoofing Identity
**Threats:**
- Token theft via XSS
- Session hijacking
- Credential stuffing

**Mitigations:**
- ✅ Token encryption (Phase 1)
- ✅ CSP headers (Phase 1)
- ✅ CSRF protection (Phase 3)
- ⚠️ TODO: httpOnly cookies (future)

### Tampering with Data
**Threats:**
- SQL injection
- Entry modification
- Code injection in journal entries

**Mitigations:**
- ✅ Input validation (Phase 1)
- ✅ Parameterized queries (backend)
- ✅ Secret detection (backend)

### Repudiation
**Threats:**
- Denial of actions
- Audit log tampering

**Mitigations:**
- ⚠️ TODO: Audit logging
- ⚠️ TODO: Immutable logs

### Information Disclosure
**Threats:**
- Error message leakage
- Sensitive data in logs
- Unencrypted storage

**Mitigations:**
- ✅ Error sanitization (Phase 2)
- ✅ Token encryption (Phase 1)
- ✅ Secret detection (backend)

### Denial of Service
**Threats:**
- API flooding
- Resource exhaustion
- Malformed requests

**Mitigations:**
- ✅ Client-side rate limiting (Phase 3)
- ⚠️ TODO: Server-side rate limiting
- ✅ Input validation (Phase 1)

### Elevation of Privilege
**Threats:**
- Authorization bypass
- API endpoint enumeration
- Admin access escalation

**Mitigations:**
- ✅ Bearer token authentication
- ✅ CORS restrictions (Phase 2)
- ⚠️ TODO: Role-based access control

---

## Attack Scenarios

### Scenario 1: XSS Attack
**Attack Vector:** Malicious script in journal entry  
**Impact:** Token theft, session hijacking  
**Likelihood:** Medium  
**Severity:** High

**Mitigations:**
- ✅ CSP headers prevent inline scripts
- ✅ Input sanitization removes dangerous characters
- ✅ Token encryption limits damage

### Scenario 2: CSRF Attack
**Attack Vector:** Malicious site triggers authenticated request  
**Impact:** Unauthorized entry creation/modification  
**Likelihood:** Low  
**Severity:** Medium

**Mitigations:**
- ✅ CSRF tokens on state-changing requests
- ✅ CORS restrictions
- ✅ SameSite cookie attributes (future)

### Scenario 3: API Abuse
**Attack Vector:** Automated requests flood API  
**Impact:** Service degradation, cost increase  
**Likelihood:** Medium  
**Severity:** Medium

**Mitigations:**
- ✅ Client-side rate limiting
- ⚠️ TODO: Server-side rate limiting
- ⚠️ TODO: API key rotation

### Scenario 4: Data Exfiltration
**Attack Vector:** Compromised token used to download all entries  
**Impact:** Complete data breach  
**Likelihood:** Low  
**Severity:** Critical

**Mitigations:**
- ✅ Token encryption at rest
- ✅ HTTPS enforcement (Phase 2)
- ⚠️ TODO: Anomaly detection
- ⚠️ TODO: Data export limits

---

## Security Controls Matrix

| Control | Phase | Status | Effectiveness |
|---------|-------|--------|---------------|
| Token Encryption | 1 | ✅ | High |
| CSP Headers | 1 | ✅ | High |
| Input Validation | 1 | ✅ | High |
| URL Validation | 1 | ✅ | Medium |
| HTTPS Enforcement | 2 | ✅ | High |
| Error Sanitization | 2 | ✅ | Medium |
| API URL Validation | 2 | ✅ | Medium |
| CORS Tightening | 2 | ✅ | High |
| CSRF Protection | 3 | ✅ | High |
| Rate Limiting | 3 | ✅ | Medium |
| SRI Hashes | 3 | ⚠️ | Low |
| Audit Logging | Future | ⚠️ | High |

---

## Residual Risks

### High Priority
1. **No server-side rate limiting** - Client-side only, can be bypassed
2. **Sequential entry IDs** - Enumeration possible
3. **No audit logging** - Limited forensics capability

### Medium Priority
4. **Token in localStorage** - Vulnerable to XSS (mitigated by encryption)
5. **No anomaly detection** - Unusual patterns not detected
6. **Single authentication factor** - No MFA

### Low Priority
7. **No SRI for CDN resources** - CDN compromise risk
8. **No data export limits** - Bulk download possible
9. **No session timeout** - Long-lived tokens

---

## Compliance Considerations

### OWASP Top 10 2021
- ✅ A01: Broken Access Control - Mitigated
- ✅ A02: Cryptographic Failures - Mitigated
- ✅ A03: Injection - Mitigated
- ⚠️ A04: Insecure Design - Partially addressed
- ✅ A05: Security Misconfiguration - Mitigated
- ⚠️ A06: Vulnerable Components - Ongoing
- ⚠️ A07: Authentication Failures - Partially addressed
- ⚠️ A08: Software/Data Integrity - Partially addressed
- ⚠️ A09: Logging Failures - Not addressed
- ⚠️ A10: SSRF - Not applicable

### GDPR (if applicable)
- ⚠️ Data encryption at rest
- ⚠️ Right to erasure
- ⚠️ Data portability
- ⚠️ Breach notification

---

## Monitoring & Detection

### Security Metrics
- Failed authentication attempts
- Rate limit violations
- CSP violations
- Error rates by endpoint

### Alerting Thresholds
- >10 failed auth attempts/minute
- >100 rate limit hits/hour
- >50 CSP violations/hour
- >5% error rate

---

## Incident Response

### Severity Levels
- **P0 (Critical):** Active breach, data exfiltration
- **P1 (High):** Vulnerability exploitation, service disruption
- **P2 (Medium):** Suspicious activity, potential vulnerability
- **P3 (Low):** Policy violation, minor issue

### Response Procedures
1. **Detect:** Monitor alerts, user reports
2. **Contain:** Revoke tokens, block IPs
3. **Investigate:** Review logs, analyze impact
4. **Remediate:** Patch vulnerabilities, restore service
5. **Document:** Post-mortem, lessons learned

---

## Review Schedule

- **Quarterly:** Threat model review
- **Bi-annually:** Penetration testing
- **Annually:** Security audit
- **Ad-hoc:** After major changes

---

## References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling)
- [STRIDE Methodology](https://docs.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)

---

**Document Owner:** Security Team  
**Approved By:** [Pending]  
**Next Review:** 2026-08-02

Made with Bob