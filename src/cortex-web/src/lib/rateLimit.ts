/**
 * Client-side rate limiting utilities (OWASP Phase 3)
 * Prevents accidental DoS and improves UX
 */

/**
 * Simple rate limiter using sliding window algorithm
 */
export class RateLimiter {
  private requests: number[] = [];
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  /**
   * Check if a request can be made within rate limits
   * @returns true if request is allowed, false if rate limited
   */
  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Remove requests outside the time window
    this.requests = this.requests.filter(t => now - t < this.windowMs);
    
    // Check if we've exceeded the limit
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    // Record this request
    this.requests.push(now);
    return true;
  }
  
  /**
   * Get the number of requests made in the current window
   */
  getRequestCount(): number {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);
    return this.requests.length;
  }
  
  /**
   * Get time until next request is allowed (in ms)
   * Returns 0 if request can be made now
   */
  getTimeUntilNextRequest(): number {
    if (this.requests.length < this.maxRequests) {
      return 0;
    }
    
    const now = Date.now();
    const oldestRequest = this.requests[0];
    const timeUntilExpiry = this.windowMs - (now - oldestRequest);
    
    return Math.max(0, timeUntilExpiry);
  }
  
  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requests = [];
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // Search: 10 requests per minute
  search: new RateLimiter(10, 60000),
  
  // API calls: 30 requests per minute
  api: new RateLimiter(30, 60000),
  
  // Entry creation: 5 per minute
  createEntry: new RateLimiter(5, 60000),
  
  // Settings updates: 3 per minute
  settings: new RateLimiter(3, 60000),
};

/**
 * Decorator function to rate limit async functions
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  limiter: RateLimiter,
  onRateLimited?: () => void
): T {
  return (async (...args: any[]) => {
    if (!limiter.canMakeRequest()) {
      if (onRateLimited) {
        onRateLimited();
      }
      const waitTime = limiter.getTimeUntilNextRequest();
      throw new Error(`Rate limited. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }
    
    return fn(...args);
  }) as T;
}

// Made with Bob