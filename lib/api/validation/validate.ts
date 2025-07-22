import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withCORS } from '../middleware';

type ValidationConfig = {
  body?: z.ZodType<any, any>;
  query?: z.ZodType<any, any>;
  params?: z.ZodType<any, any>;
};

export function withValidation<T extends ValidationConfig>(
  config: T,
  handler: (
    req: NextRequest,
    data: {
      body: T['body'] extends z.ZodType ? z.infer<T['body']> : undefined;
      query: T['query'] extends z.ZodType ? z.infer<T['query']> : undefined;
      params: T['params'] extends z.ZodType ? z.infer<T['params']> : undefined;
    }
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    try {
      const data = {
        body: undefined as any,
        query: undefined as any,
        params: undefined as any,
      };

      // Validate query parameters
      if (config.query) {
        const url = new URL(req.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());
        const parsed = config.query.safeParse(queryParams);
        
        if (!parsed.success) {
          return withCORS(NextResponse.json({
            error: 'Invalid query parameters',
            code: 400,
            details: parsed.error.flatten(),
          }, { status: 400 }));
        }
        
        data.query = parsed.data;
      }

      // Validate request body
      if (config.body && ['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
        try {
          const body = await req.json();
          const parsed = config.body.safeParse(body);
          
          if (!parsed.success) {
            return withCORS(NextResponse.json({
              error: 'Invalid request body',
              code: 400,
              details: parsed.error.flatten(),
            }, { status: 400 }));
          }
          
          data.body = parsed.data;
        } catch (e) {
          return withCORS(NextResponse.json({
            error: 'Invalid JSON in request body',
            code: 400,
          }, { status: 400 }));
        }
      }

      // Validate route params if provided
      if (config.params && context?.params) {
        const parsed = config.params.safeParse(context.params);
        
        if (!parsed.success) {
          return withCORS(NextResponse.json({
            error: 'Invalid route parameters',
            code: 400,
            details: parsed.error.flatten(),
          }, { status: 400 }));
        }
        
        data.params = parsed.data;
      }

      return handler(req, data);
    } catch (error) {
      console.error('Validation error:', error);
      return withCORS(NextResponse.json({
        error: 'Internal validation error',
        code: 500,
      }, { status: 500 }));
    }
  };
}