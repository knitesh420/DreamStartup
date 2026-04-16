import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from './ApiError';
import connectDB from './db';

type RouteContext<TParams extends Record<string, string> = Record<string, string>> = {
  params: Promise<TParams>;
};

type StaticHandler = (req: NextRequest) => Promise<NextResponse>;

type DynamicHandler<TParams extends Record<string, string> = Record<string, string>> = (
  req: NextRequest,
  context: RouteContext<TParams>
) => Promise<NextResponse>;

/**
 * Wraps a Next.js route handler with:
 *  - automatic DB connection
 *  - centralized error handling (ApiError → JSON, unknown → 500)
 */
export function withDB(handler: StaticHandler): StaticHandler;
export function withDB<TParams extends Record<string, string> = Record<string, string>>(
  handler: DynamicHandler<TParams>
): DynamicHandler<TParams>;
export function withDB<TParams extends Record<string, string> = Record<string, string>>(
  handler: StaticHandler | DynamicHandler<TParams>
): StaticHandler | DynamicHandler<TParams> {
  return async (req, context) => {
    try {
      await connectDB();
      return await handler(req, context as RouteContext<TParams>);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { success: false, message: err.message, errors: err.errors },
          { status: err.statusCode }
        );
      }
      // Mongoose duplicate key
      if ((err as NodeJS.ErrnoException & { code?: number }).code === 11000) {
        return NextResponse.json(
          { success: false, message: 'Duplicate field value entered' },
          { status: 400 }
        );
      }
      console.error('Unhandled route error:', err);
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

export function ok(data: unknown, message = 'Success', status = 200): NextResponse {
  return NextResponse.json({ success: true, statusCode: status, data, message }, { status });
}
