/**
 * Tests for security validation utilities (OWASP Phase 1 & 2)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateSearchQuery,
  validateEntryId,
  validateApiUrl,
  sanitizeErrorMessage,
  MAX_QUERY_LENGTH,
  MAX_API_URL_LENGTH,
} from '../validation';

describe('validateSearchQuery', () => {
  it('should accept valid queries', () => {
    expect(validateSearchQuery('test query')).toBe('test query');
    expect(validateSearchQuery('  trimmed  ')).toBe('trimmed');
  });

  it('should reject empty queries', () => {
    expect(() => validateSearchQuery('')).toThrow('cannot be empty');
    expect(() => validateSearchQuery('   ')).toThrow('cannot be empty');
  });

  it('should reject queries that are too long', () => {
    const longQuery = 'a'.repeat(MAX_QUERY_LENGTH + 1);
    expect(() => validateSearchQuery(longQuery)).toThrow('too long');
  });

  it('should sanitize dangerous characters', () => {
    expect(validateSearchQuery('test<script>')).toBe('testscript');
    expect(validateSearchQuery('test;DROP TABLE')).toBe('testDROP TABLE');
  });
});

describe('validateEntryId', () => {
  it('should accept valid positive integers', () => {
    expect(validateEntryId('1')).toBe(1);
    expect(validateEntryId('123')).toBe(123);
    expect(validateEntryId('999999')).toBe(999999);
  });

  it('should reject undefined or empty IDs', () => {
    expect(() => validateEntryId(undefined)).toThrow('required');
    expect(() => validateEntryId('')).toThrow('required');
  });

  it('should reject non-numeric IDs', () => {
    expect(() => validateEntryId('abc')).toThrow('Invalid entry ID');
    expect(() => validateEntryId('12.5')).toThrow('Invalid entry ID');
  });

  it('should reject negative or zero IDs', () => {
    expect(() => validateEntryId('0')).toThrow('Invalid entry ID');
    expect(() => validateEntryId('-1')).toThrow('Invalid entry ID');
  });

  it('should reject extremely large numbers', () => {
    const tooLarge = (Number.MAX_SAFE_INTEGER + 1).toString();
    expect(() => validateEntryId(tooLarge)).toThrow('too large');
  });
});

describe('validateApiUrl - Phase 2', () => {
  beforeEach(() => {
    // Reset import.meta.env for each test
    vi.stubGlobal('import', {
      meta: {
        env: {
          PROD: false,
          DEV: true,
        },
      },
    });
  });

  it('should accept valid HTTPS URLs', () => {
    const url = 'https://api.cortex.dev';
    expect(validateApiUrl(url)).toBe(url);
  });

  it('should accept localhost HTTP in development', () => {
    const url = 'http://localhost:8080';
    expect(validateApiUrl(url)).toBe(url);
  });

  it('should accept 127.0.0.1 HTTP in development', () => {
    const url = 'http://127.0.0.1:8080';
    expect(validateApiUrl(url)).toBe(url);
  });

  it('should reject HTTP URLs in production', () => {
    vi.stubGlobal('import', {
      meta: {
        env: {
          PROD: true,
          DEV: false,
        },
      },
    });

    expect(() => validateApiUrl('http://api.cortex.dev')).toThrow('HTTPS');
  });

  it('should reject empty URLs', () => {
    expect(() => validateApiUrl('')).toThrow('cannot be empty');
    expect(() => validateApiUrl('   ')).toThrow('cannot be empty');
  });

  it('should reject URLs that are too long', () => {
    const longUrl = 'https://api.cortex.dev/' + 'a'.repeat(MAX_API_URL_LENGTH);
    expect(() => validateApiUrl(longUrl)).toThrow('too long');
  });

  it('should reject invalid URL formats', () => {
    expect(() => validateApiUrl('not-a-url')).toThrow('Invalid URL');
    expect(() => validateApiUrl('ftp://api.cortex.dev')).toThrow('HTTP');
  });

  it('should reject non-whitelisted domains in production', () => {
    vi.stubGlobal('import', {
      meta: {
        env: {
          PROD: true,
          DEV: false,
        },
      },
    });

    expect(() => validateApiUrl('https://evil.com')).toThrow('not in the allowed list');
  });

  it('should accept whitelisted domains', () => {
    const validUrls = [
      'https://api.cortex.dev',
      'https://cortex-api.herokuapp.com',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
    ];

    validUrls.forEach(url => {
      expect(() => validateApiUrl(url)).not.toThrow();
    });
  });
});

describe('sanitizeErrorMessage - Phase 2', () => {
  beforeEach(() => {
    vi.stubGlobal('import', {
      meta: {
        env: {
          PROD: false,
          DEV: true,
        },
      },
    });
  });

  it('should return full error in development', () => {
    const fullError = 'Detailed error: database connection failed at line 42';
    expect(sanitizeErrorMessage(500, fullError)).toBe(fullError);
  });

  it('should sanitize errors in production', () => {
    vi.stubGlobal('import', {
      meta: {
        env: {
          PROD: true,
          DEV: false,
        },
      },
    });

    expect(sanitizeErrorMessage(400, 'Bad request details')).toBe('Invalid request');
    expect(sanitizeErrorMessage(401, 'Token expired')).toBe('Authentication required');
    expect(sanitizeErrorMessage(403, 'Forbidden')).toBe('Access denied');
    expect(sanitizeErrorMessage(404, 'Not found')).toBe('Resource not found');
    expect(sanitizeErrorMessage(422, 'Validation failed')).toBe('Invalid input provided');
    expect(sanitizeErrorMessage(500, 'Internal error')).toBe('Internal server error');
    expect(sanitizeErrorMessage(502, 'Bad gateway')).toBe('Service temporarily unavailable');
    expect(sanitizeErrorMessage(503, 'Service unavailable')).toBe('Service unavailable');
  });

  it('should provide generic message for unknown status codes in production', () => {
    vi.stubGlobal('import', {
      meta: {
        env: {
          PROD: true,
          DEV: false,
        },
      },
    });

    expect(sanitizeErrorMessage(418, "I'm a teapot")).toBe('An error occurred');
    expect(sanitizeErrorMessage(999, 'Unknown error')).toBe('An error occurred');
  });
});

// Made with Bob
