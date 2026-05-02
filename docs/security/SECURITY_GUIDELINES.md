# Security Guidelines - Cortex Developer Journal

**Version:** 1.0  
**Last Updated:** 2026-05-02  
**Audience:** Developers, Security Reviewers

---

## Overview

This document provides security guidelines for developing and maintaining the Cortex Developer Journal application. All contributors must follow these guidelines to maintain the security posture of the application.

---

## General Principles

### 1. Defense in Depth
Implement multiple layers of security controls. Never rely on a single security measure.

### 2. Least Privilege
Grant minimum necessary permissions. Users and services should only access what they need.

### 3. Fail Securely
When errors occur, fail in a secure state. Never expose sensitive information in error messages.

### 4. Secure by Default
Security features should be enabled by default, not opt-in.

### 5. Keep It Simple
Complex security implementations are harder to audit and more likely to have vulnerabilities.

---

## Authentication & Authorization

### Token Handling
```typescript
// ✅ GOOD: Encrypt tokens before storage
const encrypted = encryptToken(token);
localStorage.setItem('token', encrypted);

// ❌ BAD: Store tokens in plaintext
localStorage.setItem('token', token);
```

### Session Management
```typescript
// ✅ GOOD: Regenerate CSRF token on login
login(token);
regenerateCsrfToken();

// ❌ BAD: Reuse CSRF tokens across sessions
// (No regeneration)
```

### Password/Token Validation
```typescript
// ✅ GOOD: Validate token format
if (!token || token.length < 32) {
  throw new Error('Invalid token');
}

// ❌ BAD: Accept any token
setToken(userInput);
```

---

## Input Validation

### Always Validate User Input
```typescript
// ✅ GOOD: Validate before use
const validQuery = validateSearchQuery(userInput);
await searchEntries(token, validQuery);

// ❌ BAD: Use raw user input
await searchEntries(token, userInput);
```

### Sanitize HTML Content
```typescript
// ✅ GOOD: Remove dangerous characters
const sanitized = input.replace(/[;<>]/g, '');

// ❌ BAD: Render raw HTML
dangerouslySetInnerHTML={{ __html: userInput }}
```

### Validate URL Parameters
```typescript
// ✅ GOOD: Validate entry IDs
const validId = validateEntryId(params.id);
const entry = await getEntry(token, validId);

// ❌ BAD: Use params directly
const entry = await getEntry(token, Number(params.id));
```

---

## API Security

### HTTPS Enforcement
```typescript
// ✅ GOOD: Enforce HTTPS in production
if (import.meta.env.PROD && !url.startsWith('https://')) {
  throw new Error('HTTPS required in production');
}

// ❌ BAD: Allow HTTP in production
const apiUrl = userInput; // Could be http://
```

### Rate Limiting
```typescript
// ✅ GOOD: Check rate limits
if (!rateLimiter.canMakeRequest()) {
  throw new Error('Rate limited');
}
await makeApiCall();

// ❌ BAD: No rate limiting
await makeApiCall(); // Can be abused
```

### CSRF Protection
```typescript
// ✅ GOOD: Include CSRF token in state-changing requests
headers: authHeaders(token, true) // includeCSRF = true

// ❌ BAD: No CSRF protection on POST/PATCH/DELETE
headers: authHeaders(token) // Missing CSRF
```

---

## Error Handling

### Sanitize Error Messages
```typescript
// ✅ GOOD: Generic errors in production
if (import.meta.env.PROD) {
  return sanitizeErrorMessage(status, body);
}
return body; // Full errors in dev only

// ❌ BAD: Expose internal details
throw new Error(`Database error: ${dbError.stack}`);
```

### Log Securely
```typescript
// ✅ GOOD: Log without sensitive data
console.error('Authentication failed', { userId: user.id });

// ❌ BAD: Log sensitive information
console.error('Auth failed', { token, password });
```

---

## Data Protection

### Encryption
```typescript
// ✅ GOOD: Encrypt sensitive data
const encrypted = encryptToken(sensitiveData);
storage.set(key, encrypted);

// ❌ BAD: Store sensitive data in plaintext
storage.set(key, sensitiveData);
```

### Secure Storage
```typescript
// ✅ GOOD: Use appropriate storage
// Sensitive: Encrypted localStorage
// Session: sessionStorage
// Public: Regular localStorage

// ❌ BAD: Store everything in localStorage unencrypted
```

---

## Frontend Security

### Content Security Policy
```html
<!-- ✅ GOOD: Strict CSP -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self'">

<!-- ❌ BAD: Permissive CSP -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src *; script-src * 'unsafe-inline'">
```

### Avoid Dangerous APIs
```typescript
// ✅ GOOD: Use safe alternatives
element.textContent = userInput;

// ❌ BAD: Use dangerous APIs
element.innerHTML = userInput; // XSS risk
eval(userInput); // Code injection risk
```

---

## Backend Security

### Parameterized Queries
```python
# ✅ GOOD: Use parameterized queries
cursor.execute("SELECT * FROM entries WHERE id = ?", (entry_id,))

# ❌ BAD: String concatenation
cursor.execute(f"SELECT * FROM entries WHERE id = {entry_id}")
```

### Input Validation
```python
# ✅ GOOD: Validate with Pydantic
class CreateEntryRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)

# ❌ BAD: No validation
def create_entry(text: str):
    # Use text directly
```

### Secret Detection
```python
# ✅ GOOD: Detect secrets before saving
findings = detect_secrets(entry.text)
if findings:
    raise HTTPException(422, "Secret detected")

# ❌ BAD: Save without checking
storage.insert_entry(entry.text)
```

---

## Dependency Management

### Keep Dependencies Updated
```bash
# ✅ GOOD: Regular updates
npm audit
npm update
pip-audit

# ❌ BAD: Never update dependencies
```

### Verify Package Integrity
```bash
# ✅ GOOD: Use lock files
npm ci  # Uses package-lock.json
pip install -r requirements.txt --require-hashes

# ❌ BAD: Install without verification
npm install  # May get different versions
```

---

## Code Review Checklist

### Security Review Items
- [ ] Input validation on all user inputs
- [ ] Output encoding for all dynamic content
- [ ] Authentication required for protected endpoints
- [ ] Authorization checks for data access
- [ ] CSRF protection on state-changing requests
- [ ] Rate limiting on expensive operations
- [ ] Error messages don't leak sensitive info
- [ ] Secrets not hardcoded in code
- [ ] HTTPS enforced in production
- [ ] Dependencies are up to date

### Common Vulnerabilities to Check
- [ ] SQL Injection
- [ ] Cross-Site Scripting (XSS)
- [ ] Cross-Site Request Forgery (CSRF)
- [ ] Insecure Direct Object References
- [ ] Security Misconfiguration
- [ ] Sensitive Data Exposure
- [ ] Missing Function Level Access Control
- [ ] Using Components with Known Vulnerabilities

---

## Testing Security Features

### Unit Tests
```typescript
describe('Security', () => {
  it('validates search queries', () => {
    expect(() => validateSearchQuery('')).toThrow();
    expect(() => validateSearchQuery('a'.repeat(501))).toThrow();
  });
  
  it('sanitizes error messages in production', () => {
    const sanitized = sanitizeErrorMessage(500, 'Internal error');
    expect(sanitized).not.toContain('stack');
  });
});
```

### Integration Tests
```python
def test_csrf_protection():
    # Should reject requests without CSRF token
    response = client.post("/api/v1/entries", json={...})
    assert response.status_code == 403
```

---

## Incident Response

### If You Discover a Vulnerability

1. **DO NOT** commit the vulnerability to version control
2. **DO NOT** discuss publicly (GitHub issues, Slack, etc.)
3. **DO** report to security team immediately
4. **DO** document the vulnerability privately
5. **DO** help develop a fix if possible

### Reporting Format
```
Title: [Brief description]
Severity: Critical/High/Medium/Low
Component: [Affected component]
Description: [Detailed description]
Steps to Reproduce: [How to trigger]
Impact: [What could happen]
Suggested Fix: [If known]
```

---

## Security Tools

### Recommended Tools
- **SAST:** ESLint security plugins, Bandit (Python)
- **DAST:** OWASP ZAP, Burp Suite
- **Dependency Scanning:** npm audit, pip-audit, Snyk
- **Secret Scanning:** git-secrets, TruffleHog
- **Container Scanning:** Trivy, Clair

### CI/CD Integration
```yaml
# Example GitHub Actions
- name: Security Audit
  run: |
    npm audit --audit-level=high
    pip-audit
    
- name: SAST Scan
  run: |
    eslint --ext .ts,.tsx src/
    bandit -r src/cortex-api/
```

---

## Resources

### Internal
- [Threat Model](./THREAT_MODEL.md)
- [Security Remediation Plan](./SECURITY_REMEDIATION_PLAN.md)

### External
- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

## Updates & Maintenance

This document should be reviewed and updated:
- After security incidents
- When new features are added
- Quarterly as part of security review
- When new vulnerabilities are discovered

---

**Document Owner:** Security Team  
**Last Reviewed:** 2026-05-02  
**Next Review:** 2026-08-02

Made with Bob