/**
 * CSRF (Cross-Site Request Forgery) protection utilities (OWASP Phase 3)
 * Implements double-submit cookie pattern
 */

const CSRF_TOKEN_KEY = 'cortex.csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create CSRF token
 * Token is stored in localStorage and sent with each request
 */
export function getCsrfToken(): string {
  let token = localStorage.getItem(CSRF_TOKEN_KEY);
  
  if (!token) {
    token = generateToken();
    localStorage.setItem(CSRF_TOKEN_KEY, token);
  }
  
  return token;
}

/**
 * Regenerate CSRF token (call on login/logout)
 */
export function regenerateCsrfToken(): string {
  const token = generateToken();
  localStorage.setItem(CSRF_TOKEN_KEY, token);
  return token;
}

/**
 * Clear CSRF token (call on logout)
 */
export function clearCsrfToken(): void {
  localStorage.removeItem(CSRF_TOKEN_KEY);
}

/**
 * Get CSRF header name
 */
export function getCsrfHeaderName(): string {
  return CSRF_HEADER_NAME;
}

/**
 * Add CSRF token to request headers
 */
export function addCsrfHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCsrfToken();
  
  return {
    ...headers,
    [CSRF_HEADER_NAME]: token,
  };
}

/**
 * Validate CSRF token (client-side check before sending)
 */
export function validateCsrfToken(token: string): boolean {
  const storedToken = getCsrfToken();
  return token === storedToken && token.length === 64;
}

// Made with Bob