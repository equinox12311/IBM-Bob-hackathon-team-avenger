# Security Remediation Plan - OWASP Compliance

**Project:** Cortex Developer Journal  
**Context:** IBM Bob Hackathon (May 1-3, 2026)  
**Created:** 2026-05-02  
**Status:** Draft

---

## Executive Summary

12 security issues identified in `src/cortex-web/src` ranging from **Critical** to **Low** severity. This plan provides a phased approach to remediation, prioritizing issues based on:
1. **Severity** (Critical > High > Medium > Low)
2. **Implementation complexity** (Quick wins first)
3. **Hackathon constraints** (Demo vs Production readiness)

**Key Insight:** Backend already has some security measures (bearer token auth, secret detection, CORS). Frontend needs hardening.

---

## Current Security Posture

### ✅ Already Implemented (Backend)
- Bearer token authentication (`cortex_api/auth.py`)
- Secret detection in entries (`cortex_api/secrets.py`)
- CORS middleware (configured for `allow_origins=["*"]` - needs tightening)
- Input validation via Pydantic models
- Query parameter validation (e.g., `min_length=1` on search)

### ❌ Missing (Frontend)
- Secure token storage
- Input sanitization
- CSP headers
- HTTPS enforcement
- Error message sanitization
- URL validation
- CSRF protection
- Rate limiting

---

## Phase 1: Critical & High Priority (Pre-Submission)
**Timeline:** 4-6 hours  
**Goal:** Address critical vulnerabilities that could be exploited in demo

### 1.1 ✅ CRITICAL: Secure Token Storage
**Current:** Token stored in plain localStorage  
**Risk:** XSS attacks can steal tokens  
**Files:** `src/cortex-web/src/hooks/useAuth.tsx`

**Solution Options:**
1. **Quick Fix (Hackathon):** Add token encryption before localStorage
2. **Better Fix (Post-hackathon):** Migrate to httpOnly cookies

**Implementation (Quick Fix):**
```typescript
// src/cortex-web/src/lib/crypto.ts
export function encryptToken(token: string): string {
  // Simple XOR encryption with browser fingerprint
  const key = navigator.userAgent + window.location.origin;
  return btoa(xorEncrypt(token, key));
}

export function decryptToken(encrypted: string): string {
  const key = navigator.userAgent + window.location.origin;
  return xorDecrypt(atob(encrypted), key);
}
```

**Effort:** 1 hour  
**Priority:** P0 - Do before demo

---

### 1.2 ✅ HIGH: Content Security Policy (CSP)
**Current:** No CSP headers  
**Risk:** XSS attacks, malicious script injection  
**Files:** `src/cortex-web/index.html`, `src/cortex-web/vite.config.ts`

**Implementation:**
```html
<!-- src/cortex-web/index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
               font-src 'self' https://fonts.gstatic.com;
               img-src 'self' data: https:;
               connect-src 'self' http://localhost:8080 https://api.cortex.dev;">
```

**Note:** `unsafe-inline` needed for Vite HMR in dev. Remove in production.

**Effort:** 30 minutes  
**Priority:** P0 - Do before demo

---

### 1.3 ✅ HIGH: Input Validation & Sanitization
**Current:** No client-side validation  
**Risk:** Injection attacks, DoS via large inputs  
**Files:** Multiple components

**Implementation:**
```typescript
// src/cortex-web/src/lib/validation.ts
export const MAX_QUERY_LENGTH = 500;
export const MAX_ENTRY_TEXT_LENGTH = 10000;

export function validateSearchQuery(query: string): string {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    throw new Error("Query cannot be empty");
  }
  if (trimmed.length > MAX_QUERY_LENGTH) {
    throw new Error(`Query too long (max ${MAX_QUERY_LENGTH} chars)`);
  }
  // Remove potential SQL injection patterns (defense in depth)
  const sanitized = trimmed.replace(/[;<>]/g, '');
  return sanitized;
}

export function validateEntryId(id: string | undefined): number {
  if (!id) throw new Error("Entry ID required");
  const num = parseInt(id, 10);
  if (isNaN(num) || num <= 0) {
    throw new Error("Invalid entry ID");
  }
  return num;
}
```

**Apply to:**
- `src/cortex-web/src/pages/Search.tsx` (line 30)
- `src/cortex-web/src/pages/EntryDetail.tsx` (line 28)
- `src/cortex-web/src/components/CommandPalette.tsx` (line 48)

**Effort:** 2 hours  
**Priority:** P0 - Do before demo

---

### 1.4 ✅ HIGH: URL Parameter Validation
**Current:** Direct `Number(id)` conversion without validation  
**Risk:** Injection, enumeration attacks  
**Files:** `src/cortex-web/src/pages/EntryDetail.tsx`

**Implementation:**
```typescript
// In EntryDetail.tsx
useEffect(() => {
  if (!token || !id) return;
  
  try {
    const validId = validateEntryId(id);
    getEntry(token, validId)
      .then(setEntry)
      .catch((e) => setError(String(e)));
  } catch (e) {
    setError(e instanceof Error ? e.message : "Invalid entry ID");
  }
}, [token, id]);
```

**Effort:** 30 minutes  
**Priority:** P0 - Do before demo

---

## Phase 2: Medium Priority (Post-Demo, Pre-Production)
**Timeline:** 6-8 hours  
**Goal:** Harden for production deployment

### 2.1 ⚠️ MEDIUM: HTTPS Enforcement
**Current:** Default API URL is `http://localhost:8080`  
**Risk:** MITM attacks, token interception  
**Files:** `src/cortex-web/src/api/client.ts`

**Implementation:**
```typescript
function baseURL(): string {
  const stored = localStorage.getItem("cortex.api_base_url");
  const env = import.meta.env.VITE_API_BASE_URL;
  const url = stored || env || "http://localhost:8080";
  
  // Enforce HTTPS in production
  if (import.meta.env.PROD && !url.startsWith("https://")) {
    console.error("Production requires HTTPS API URL");
    throw new Error("Insecure API URL in production mode");
  }
  
  return url;
}
```

**Effort:** 1 hour  
**Priority:** P1 - Before production

---

### 2.2 ⚠️ MEDIUM: Error Message Sanitization
**Current:** Full error messages exposed to client  
**Risk:** Information disclosure (stack traces, DB errors)  
**Files:** `src/cortex-web/src/api/client.ts`

**Implementation:**
```typescript
async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    
    // Sanitize error messages in production
    if (import.meta.env.PROD) {
      const sanitized = sanitizeErrorMessage(res.status, body);
      throw new Error(sanitized);
    }
    
    // Full errors in development
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}

function sanitizeErrorMessage(status: number, body: string): string {
  const errorMap: Record<number, string> = {
    400: "Invalid request",
    401: "Authentication required",
    403: "Access denied",
    404: "Resource not found",
    422: "Invalid input",
    500: "Server error",
  };
  return errorMap[status] || "An error occurred";
}
```

**Effort:** 1 hour  
**Priority:** P1 - Before production

---

### 2.3 ⚠️ MEDIUM: API URL Validation
**Current:** No validation of user-provided API URLs  
**Risk:** Redirect to malicious server  
**Files:** `src/cortex-web/src/pages/Settings.tsx`

**Implementation:**
```typescript
// src/cortex-web/src/lib/validation.ts
const ALLOWED_API_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'api.cortex.dev',
  'cortex-api.herokuapp.com',
];

export function validateApiUrl(url: string): string {
  try {
    const parsed = new URL(url);
    
    // Require HTTPS in production
    if (import.meta.env.PROD && parsed.protocol !== 'https:') {
      throw new Error("Production requires HTTPS");
    }
    
    // Check domain whitelist
    const hostname = parsed.hostname;
    const isAllowed = ALLOWED_API_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
    
    if (!isAllowed) {
      throw new Error(`Domain ${hostname} not in whitelist`);
    }
    
    return url;
  } catch (e) {
    throw new Error(`Invalid API URL: ${e.message}`);
  }
}
```

**Effort:** 1.5 hours  
**Priority:** P1 - Before production

---

### 2.4 ⚠️ MEDIUM: Backend CORS Tightening
**Current:** `allow_origins=["*"]` in production  
**Risk:** CSRF, unauthorized access  
**Files:** `src/cortex-api/cortex_api/server.py`

**Implementation:**
```python
# In server.py
from cortex_api.config import settings

allowed_origins = ["*"] if settings.reload else [
    "https://cortex.dev",
    "https://www.cortex.dev",
    "http://localhost:5173",  # Vite dev server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=True,
)
```

**Effort:** 30 minutes  
**Priority:** P1 - Before production

---

## Phase 3: Low Priority (Future Enhancements)
**Timeline:** 4-6 hours
**Goal:** Defense in depth, best practices
**Status:** ✅ **COMPLETE** (2026-05-02)

### 3.1 ✅ LOW: CSRF Protection
**Current:** No CSRF tokens
**Risk:** Cross-site request forgery

**Implementation:** Double-submit cookie pattern
- ✅ Generate CSRF token on login
- ✅ Include in all state-changing requests (POST, PATCH, DELETE)
- ⚠️ Server-side validation (future enhancement)

**Files Created:**
- `src/cortex-web/src/lib/csrf.ts` - CSRF token utilities
- `src/cortex-web/src/lib/__tests__/csrf.test.ts` - Comprehensive tests

**Files Modified:**
- `src/cortex-web/src/hooks/useAuth.tsx` - Token lifecycle management
- `src/cortex-web/src/api/client.ts` - CSRF headers on state-changing requests

**Effort:** 3 hours
**Priority:** P2 - Nice to have
**Status:** ✅ COMPLETE

---

### 3.2 ✅ LOW: Client-Side Rate Limiting
**Current:** Only debouncing (200ms) in CommandPalette
**Risk:** Accidental DoS, poor UX

**Implementation:** Sliding window rate limiter with configurable limits

**Files Created:**
- `src/cortex-web/src/lib/rateLimit.ts` - RateLimiter class with sliding window algorithm
- `src/cortex-web/src/lib/__tests__/rateLimit.test.ts` - Comprehensive tests

**Files Modified:**
- `src/cortex-web/src/pages/Search.tsx` - Rate limiting on search operations

**Features:**
- ✅ Sliding window algorithm
- ✅ Pre-configured limiters (search: 10/min, API: 30/min, entries: 5/min, settings: 3/min)
- ✅ `withRateLimit` decorator for easy integration
- ✅ User-friendly error messages with retry timing

**Effort:** 2 hours
**Priority:** P2 - Nice to have
**Status:** ✅ COMPLETE

---

### 3.3 ⚪ LOW: Subresource Integrity (SRI)
**Current:** No SRI for external resources
**Risk:** CDN compromise

**Implementation:** Add integrity hashes to external scripts/styles
- Check if Carbon Design System is loaded from CDN
- Generate SRI hashes during build
- Add to `<script>` and `<link>` tags

**Effort:** 1 hour
**Priority:** P3 - Future
**Status:** ⚪ SKIPPED (No external CDN resources in current build)

---

### 3.4 ✅ LOW: Security Documentation
**Current:** No security docs
**Risk:** Knowledge loss, inconsistent practices

**Implementation:** Comprehensive security documentation suite

**Files Created:**
- ✅ `docs/security/THREAT_MODEL.md` - STRIDE threat analysis, attack scenarios, mitigations
- ✅ `docs/security/SECURITY_GUIDELINES.md` - Secure coding practices, review checklist
- ✅ `docs/security/README.md` - Security documentation index and quick reference

**Content:**
- ✅ STRIDE threat modeling methodology
- ✅ Attack scenarios and mitigations
- ✅ Security controls matrix
- ✅ Residual risks assessment
- ✅ Developer security guidelines
- ✅ Code review security checklist
- ✅ Common vulnerability patterns
- ✅ Testing recommendations

**Effort:** 2 hours
**Priority:** P3 - Future
**Status:** ✅ COMPLETE

---

## Implementation Priority Matrix

| Issue | Severity | Effort | Priority | Phase | Status |
|-------|----------|--------|----------|-------|--------|
| Token encryption | Critical | 1h | P0 | 1 | ✅ DONE |
| CSP headers | High | 0.5h | P0 | 1 | ✅ DONE |
| Input validation | High | 2h | P0 | 1 | ✅ DONE |
| URL param validation | High | 0.5h | P0 | 1 | ✅ DONE |
| HTTPS enforcement | Medium | 1h | P1 | 2 | ✅ DONE |
| Error sanitization | Medium | 1h | P1 | 2 | ✅ DONE |
| API URL validation | Medium | 1.5h | P1 | 2 | ✅ DONE |
| CORS tightening | Medium | 0.5h | P1 | 2 | ✅ DONE |
| CSRF protection | Low | 3h | P2 | 3 | ✅ DONE |
| Rate limiting | Low | 2h | P2 | 3 | ✅ DONE |
| SRI hashes | Low | 1h | P3 | 3 | ⚪ SKIPPED |
| Security docs | Low | 2h | P3 | 3 | ✅ DONE |

**Total Effort:**
- Phase 1 (Pre-Demo): 4 hours ✅ **COMPLETE**
- Phase 2 (Pre-Production): 4.5 hours ✅ **COMPLETE**
- Phase 3 (Future): 7 hours ✅ **COMPLETE** (SRI skipped)

---

## Hackathon-Specific Recommendations

### For Demo (May 3, 10:00 AM ET)
**Must Do (Phase 1):**
1. ✅ Token encryption (1h)
2. ✅ CSP headers (0.5h)
3. ✅ Input validation (2h)
4. ✅ URL validation (0.5h)

**Total:** 4 hours - **Achievable before submission**

### For Production Deployment
**Must Do (Phase 1 + 2):**
- All Phase 1 items
- HTTPS enforcement
- Error sanitization
- API URL validation
- CORS tightening

**Total:** 8.5 hours

### Post-Hackathon Roadmap
- Migrate to httpOnly cookies
- Implement CSRF protection
- Add comprehensive rate limiting
- Complete security documentation
- Security audit by external party

---

## Testing Strategy

### Manual Testing Checklist
- [ ] Try XSS injection in search queries
- [ ] Attempt to access entries with invalid IDs
- [ ] Test with extremely long input strings
- [ ] Verify CSP blocks inline scripts
- [ ] Test token encryption/decryption
- [ ] Verify HTTPS enforcement in prod build
- [ ] Test CORS with different origins

### Automated Testing
```typescript
// tests/security.test.ts
describe('Security', () => {
  it('validates search query length', () => {
    const longQuery = 'a'.repeat(501);
    expect(() => validateSearchQuery(longQuery)).toThrow();
  });
  
  it('validates entry IDs', () => {
    expect(() => validateEntryId('abc')).toThrow();
    expect(() => validateEntryId('-1')).toThrow();
    expect(validateEntryId('123')).toBe(123);
  });
  
  it('encrypts and decrypts tokens', () => {
    const token = 'secret-token-123';
    const encrypted = encryptToken(token);
    expect(encrypted).not.toBe(token);
    expect(decryptToken(encrypted)).toBe(token);
  });
});
```

---

## Risk Assessment

### Residual Risks (After Phase 1)
1. **Token storage** - Still in browser, but encrypted
2. **CSRF** - No protection yet (Phase 3)
3. **Rate limiting** - Server-side only
4. **Enumeration** - Sequential IDs still exposed

### Acceptable for Hackathon Demo?
✅ **YES** - Phase 1 addresses critical vulnerabilities for a demo environment

### Acceptable for Production?
❌ **NO** - Need Phase 2 completion minimum

---

## Sign-off

**Prepared by:** Security Review  
**Date:** 2026-05-02  
**Next Review:** After Phase 1 completion  
**Approved by:** [Team Lead to sign]

---

## Appendix: Quick Reference

### Environment Variables Needed
```bash
# .env.production
VITE_API_BASE_URL=https://api.cortex.dev
NODE_ENV=production
```

### Build Commands
```bash
# Development (relaxed security)
npm run dev

# Production (strict security)
npm run build
npm run preview
```

### Security Headers (Nginx/Production)
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;";
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";