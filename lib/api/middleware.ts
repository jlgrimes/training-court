import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, withAuthRateLimit, type RateLimitConfig } from './rate-limit';

/**
 * Authentication middleware for API routes
 * Verifies that the request has a valid authenticated user
 */
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>
) {
  try {
    const supabase = createClient();
    
    // Get the user from the session
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Pass the authenticated user ID to the handler
    return handler(request, user.id);
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * Admin middleware for API routes
 * Verifies that the authenticated user is an admin
 */
export async function withAdmin(
  request: NextRequest,
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>
) {
  return withAuth(request, async (req, userId) => {
    const adminIds = process.env.ADMIN_USER_IDS?.split(',') || [];
    
    if (!adminIds.includes(userId)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    return handler(req, userId);
  });
}

/**
 * CORS middleware for API routes
 */
export function withCORS(response: NextResponse): NextResponse {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  const origin = response.headers.get('origin');
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.includes('*')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}

/**
 * Error handler wrapper for API routes
 */
export async function withErrorHandler(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    console.error('API Error:', error);
    
    // Don't expose internal error details in production
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * Combined middleware for authenticated routes with rate limiting
 * Applies authentication first, then rate limiting based on user ID
 */
export function withAuthAndRateLimit(
  request: NextRequest,
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>,
  rateLimitConfig?: Omit<RateLimitConfig, 'keyGenerator'>
) {
  return withAuth(request, (req, userId) => 
    withAuthRateLimit(rateLimitConfig, handler)(req, userId)
  );
}

/**
 * Export rate limiting functions for direct use
 */
export { withRateLimit, withAuthRateLimit } from './rate-limit';