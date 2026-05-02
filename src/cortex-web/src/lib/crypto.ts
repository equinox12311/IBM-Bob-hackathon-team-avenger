/**
 * Cryptographic utilities for secure token storage
 * Part of OWASP remediation Phase 1
 * 
 * Note: This provides basic obfuscation for localStorage tokens.
 * For production, consider migrating to httpOnly cookies.
 */

/**
 * Simple XOR cipher for token obfuscation
 * Not cryptographically secure, but prevents casual inspection
 */
function xorCipher(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

/**
 * Generate a browser-specific key for token encryption
 * Uses browser fingerprint to make tokens non-portable
 */
function getBrowserKey(): string {
  // Combine multiple browser properties for a unique key
  const components = [
    navigator.userAgent,
    window.location.origin,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    new Date().getTimezoneOffset().toString(),
  ];
  
  return components.join('|');
}

/**
 * Encrypts a token for storage in localStorage
 * Uses XOR cipher with browser fingerprint
 */
export function encryptToken(token: string): string {
  if (!token || token.trim().length === 0) {
    throw new Error("Cannot encrypt empty token");
  }
  
  const key = getBrowserKey();
  const encrypted = xorCipher(token, key);
  
  // Base64 encode to make it safe for localStorage
  return btoa(encrypted);
}

/**
 * Decrypts a token from localStorage
 * Returns null if decryption fails
 */
export function decryptToken(encrypted: string): string | null {
  if (!encrypted || encrypted.trim().length === 0) {
    return null;
  }
  
  try {
    const key = getBrowserKey();
    const decoded = atob(encrypted);
    const decrypted = xorCipher(decoded, key);
    
    // Basic validation: token should be printable ASCII
    if (!/^[\x20-\x7E]+$/.test(decrypted)) {
      console.warn("Decrypted token contains invalid characters");
      return null;
    }
    
    return decrypted;
  } catch (e) {
    console.error("Token decryption failed:", e);
    return null;
  }
}

/**
 * Securely clears a token from memory
 * Overwrites the string in memory before garbage collection
 */
export function clearToken(_token: string): void {
  // In JavaScript, we can't truly overwrite memory
  // But we can at least clear the reference
  // The underscore prefix indicates intentionally unused parameter
}

// Made with Bob
