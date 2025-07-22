import { NextRequest, NextResponse } from 'next/server';
import { withCORS } from './middleware';

// Simple in-memory rate limiter
// In production, you'd want to use Redis or a similar solution
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowMs?: number; // Time window in milliseconds (default: 1 minute)
  max?: number; // Max requests per window (default: 60)
  keyGenerator?: (req: NextRequest) => string; // Function to generate rate limit key
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  message?: string; // Custom error message
}

const defaultConfig: Required<RateLimitConfig> = {
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.API_RATE_LIMIT_PER_MINUTE || '60'),
  keyGenerator: (req) => {
    // Use IP address as default key
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return ip;
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  message: 'Too many requests, please try again later.',
};

export function withRateLimit(
  config: RateLimitConfig = {},
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  const finalConfig = { ...defaultConfig, ...config };

  return async (req: NextRequest): Promise<NextResponse> => {
    const key = finalConfig.keyGenerator(req);
    const now = Date.now();
    const windowStart = now - finalConfig.windowMs;

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + finalConfig.windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= finalConfig.max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      return withCORS(NextResponse.json({
        error: finalConfig.message,
        code: 429,
        retryAfter,
      }, { 
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': finalConfig.max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
        }
      }));
    }

    // Increment counter before handling request
    if (!finalConfig.skipSuccessfulRequests && !finalConfig.skipFailedRequests) {
      entry.count++;
    }

    try {
      const response = await handler(req);
      
      // Increment counter after successful request if configured
      if (finalConfig.skipFailedRequests && !finalConfig.skipSuccessfulRequests && response.status < 400) {
        entry.count++;
      }

      // Add rate limit headers to response
      const headers = new Headers(response.headers);
      headers.set('X-RateLimit-Limit', finalConfig.max.toString());
      headers.set('X-RateLimit-Remaining', Math.max(0, finalConfig.max - entry.count).toString());
      headers.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      // Increment counter after failed request if configured  
      if (finalConfig.skipSuccessfulRequests && !finalConfig.skipFailedRequests) {
        entry.count++;
      }
      
      throw error;
    }
  };
}

// Convenience function for authenticated rate limiting (uses user ID as key)
export function withAuthRateLimit(
  config: Omit<RateLimitConfig, 'keyGenerator'> = {},
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return (req: NextRequest, userId: string) => {
    const rateLimitConfig: RateLimitConfig = {
      ...config,
      keyGenerator: () => userId, // Use user ID as rate limit key
    };
    
    return withRateLimit(rateLimitConfig, () => handler(req, userId))(req);
  };
}