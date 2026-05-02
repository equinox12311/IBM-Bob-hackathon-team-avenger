/**
 * Tests for CSRF protection utilities (OWASP Phase 3)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCsrfToken, regenerateCsrfToken, clearCsrfToken, addCsrfHeader } from '../csrf';

describe('CSRF Protection', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getCsrfToken', () => {
    it('should generate a token if none exists', () => {
      const token = getCsrfToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should return the same token on subsequent calls', () => {
      const token1 = getCsrfToken();
      const token2 = getCsrfToken();
      
      expect(token1).toBe(token2);
    });

    it('should store token in localStorage', () => {
      const token = getCsrfToken();
      const storedToken = localStorage.getItem('csrf_token');
      
      expect(storedToken).toBe(token);
    });

    it('should generate cryptographically random tokens', () => {
      clearCsrfToken();
      const token1 = getCsrfToken();
      
      clearCsrfToken();
      const token2 = getCsrfToken();
      
      // Tokens should be different
      expect(token1).not.toBe(token2);
    });
  });

  describe('regenerateCsrfToken', () => {
    it('should generate a new token', () => {
      const oldToken = getCsrfToken();
      const newToken = regenerateCsrfToken();
      
      expect(newToken).not.toBe(oldToken);
      expect(newToken).toBeDefined();
    });

    it('should update localStorage with new token', () => {
      const oldToken = getCsrfToken();
      const newToken = regenerateCsrfToken();
      const storedToken = localStorage.getItem('csrf_token');
      
      expect(storedToken).toBe(newToken);
      expect(storedToken).not.toBe(oldToken);
    });
  });

  describe('clearCsrfToken', () => {
    it('should remove token from localStorage', () => {
      getCsrfToken();
      expect(localStorage.getItem('csrf_token')).toBeDefined();
      
      clearCsrfToken();
      expect(localStorage.getItem('csrf_token')).toBeNull();
    });

    it('should allow generating new token after clearing', () => {
      const token1 = getCsrfToken();
      clearCsrfToken();
      const token2 = getCsrfToken();
      
      expect(token2).toBeDefined();
      expect(token2).not.toBe(token1);
    });
  });

  describe('addCsrfHeader', () => {
    it('should add CSRF token to headers object', () => {
      const token = getCsrfToken();
      const headers: Record<string, string> = {};
      
      addCsrfHeader(headers);
      
      expect(headers['X-CSRF-Token']).toBe(token);
    });

    it('should not overwrite existing headers', () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token123'
      };
      
      addCsrfHeader(headers);
      
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Authorization']).toBe('Bearer token123');
      expect(headers['X-CSRF-Token']).toBeDefined();
    });

    it('should use current token from localStorage', () => {
      const token = getCsrfToken();
      const headers: Record<string, string> = {};
      
      addCsrfHeader(headers);
      
      expect(headers['X-CSRF-Token']).toBe(token);
    });
  });

  describe('Token Format', () => {
    it('should generate tokens with correct length', () => {
      const token = getCsrfToken();
      
      // 32 bytes = 64 hex characters
      expect(token.length).toBe(64);
    });

    it('should generate tokens with only hex characters', () => {
      const token = getCsrfToken();
      const hexPattern = /^[0-9a-f]+$/;
      
      expect(hexPattern.test(token)).toBe(true);
    });
  });
});

// Made with Bob
