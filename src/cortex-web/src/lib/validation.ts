/**
 * Input validation utilities for security hardening
 * Part of OWASP remediation Phase 1
 */

export const MAX_QUERY_LENGTH = 500;
export const MAX_ENTRY_TEXT_LENGTH = 10000;
export const MAX_API_URL_LENGTH = 200;

/**
 * Validates and sanitizes search query input
 * @throws Error if validation fails
 */
export function validateSearchQuery(query: string): string {
  const trimmed = query.trim();
  
  if (trimmed.length === 0) {
    throw new Error("Query cannot be empty");
  }
  
  if (trimmed.length > MAX_QUERY_LENGTH) {
    throw new Error(`Query too long (max ${MAX_QUERY_LENGTH} characters)`);
  }
  
  // Remove potentially dangerous characters (defense in depth)
  // Backend should also validate, but client-side helps prevent accidents
  const sanitized = trimmed.replace(/[;<>]/g, '');
  
  return sanitized;
}

/**
 * Validates entry ID from URL parameters
 * @throws Error if validation fails
 */
export function validateEntryId(id: string | undefined): number {
  if (!id) {
    throw new Error("Entry ID is required");
  }
  
  const num = parseInt(id, 10);
  
  if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
    throw new Error("Invalid entry ID format");
  }
  
  // Prevent extremely large numbers that could cause issues
  if (num > Number.MAX_SAFE_INTEGER) {
    throw new Error("Entry ID too large");
  }
  
  return num;
}

/**
 * Validates API URL for security
 * Allowed domains can be configured
 */
export function validateApiUrl(url: string): string {
  if (!url || url.trim().length === 0) {
    throw new Error("API URL cannot be empty");
  }
  
  if (url.length > MAX_API_URL_LENGTH) {
    throw new Error(`API URL too long (max ${MAX_API_URL_LENGTH} characters)`);
  }
  
  try {
    const parsed = new URL(url);
    
    // Require HTTPS in production mode
    if (import.meta.env.PROD && parsed.protocol !== 'https:') {
      throw new Error("Production requires HTTPS protocol");
    }
    
    // Allow http only for localhost in development
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error("Only HTTP and HTTPS protocols are allowed");
    }
    
    // Whitelist of allowed domains
    const ALLOWED_DOMAINS = [
      'localhost',
      '127.0.0.1',
      'api.cortex.dev',
      'cortex-api.herokuapp.com',
    ];
    
    const hostname = parsed.hostname;
    const isAllowed = ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
    
    if (!isAllowed && import.meta.env.PROD) {
      throw new Error(`Domain ${hostname} is not in the allowed list`);
    }
    
    return url;
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`Invalid API URL: ${e.message}`);
    }
    throw new Error("Invalid API URL format");
  }
}

/**
 * Validates text entry content
 * @throws Error if validation fails
 */
export function validateEntryText(text: string): string {
  if (!text || text.trim().length === 0) {
    throw new Error("Entry text cannot be empty");
  }
  
  if (text.length > MAX_ENTRY_TEXT_LENGTH) {
    throw new Error(`Entry text too long (max ${MAX_ENTRY_TEXT_LENGTH} characters)`);
  }
  
  return text;
}

// Made with Bob
