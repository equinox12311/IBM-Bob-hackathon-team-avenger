/**
 * Tests for rate limiting utilities (OWASP Phase 3)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter, withRateLimit } from '../rateLimit';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    // 3 requests per 1000ms window
    limiter = new RateLimiter(3, 1000);
  });

  it('should allow requests within limit', () => {
    expect(limiter.canMakeRequest()).toBe(true);
    expect(limiter.canMakeRequest()).toBe(true);
    expect(limiter.canMakeRequest()).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    limiter.canMakeRequest();
    limiter.canMakeRequest();
    limiter.canMakeRequest();
    
    // 4th request should be blocked
    expect(limiter.canMakeRequest()).toBe(false);
  });

  it('should track request count correctly', () => {
    expect(limiter.getRequestCount()).toBe(0);
    
    limiter.canMakeRequest();
    expect(limiter.getRequestCount()).toBe(1);
    
    limiter.canMakeRequest();
    expect(limiter.getRequestCount()).toBe(2);
  });

  it('should calculate time until next request', () => {
    limiter.canMakeRequest();
    limiter.canMakeRequest();
    limiter.canMakeRequest();
    
    const timeUntilNext = limiter.getTimeUntilNextRequest();
    expect(timeUntilNext).toBeGreaterThan(0);
    expect(timeUntilNext).toBeLessThanOrEqual(1000);
  });

  it('should reset rate limiter', () => {
    limiter.canMakeRequest();
    limiter.canMakeRequest();
    limiter.canMakeRequest();
    
    expect(limiter.canMakeRequest()).toBe(false);
    
    limiter.reset();
    expect(limiter.canMakeRequest()).toBe(true);
  });

  it('should allow requests after time window expires', async () => {
    vi.useFakeTimers();
    
    limiter.canMakeRequest();
    limiter.canMakeRequest();
    limiter.canMakeRequest();
    
    expect(limiter.canMakeRequest()).toBe(false);
    
    // Advance time past the window
    vi.advanceTimersByTime(1100);
    
    expect(limiter.canMakeRequest()).toBe(true);
    
    vi.useRealTimers();
  });
});

describe('withRateLimit', () => {
  it('should allow function execution within limits', async () => {
    const limiter = new RateLimiter(2, 1000);
    const mockFn = vi.fn().mockResolvedValue('success');
    const rateLimitedFn = withRateLimit(mockFn, limiter);
    
    await expect(rateLimitedFn()).resolves.toBe('success');
    await expect(rateLimitedFn()).resolves.toBe('success');
    
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should throw error when rate limited', async () => {
    const limiter = new RateLimiter(1, 1000);
    const mockFn = vi.fn().mockResolvedValue('success');
    const rateLimitedFn = withRateLimit(mockFn, limiter);
    
    await rateLimitedFn();
    
    await expect(rateLimitedFn()).rejects.toThrow('Rate limited');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should call onRateLimited callback', async () => {
    const limiter = new RateLimiter(1, 1000);
    const mockFn = vi.fn().mockResolvedValue('success');
    const onRateLimited = vi.fn();
    const rateLimitedFn = withRateLimit(mockFn, limiter, onRateLimited);
    
    await rateLimitedFn();
    
    await expect(rateLimitedFn()).rejects.toThrow();
    expect(onRateLimited).toHaveBeenCalledTimes(1);
  });
});

// Made with Bob
