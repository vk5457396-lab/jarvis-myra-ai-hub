import { NextRequest, NextResponse } from 'next/server';
import { ApiError, failure } from '../utils/response';
import { rateLimit } from './rateLimit';
import logger from '../utils/logger';

const DEFAULT_ORIGINS = ['https://codeninjavik.in', 'https://www.codeninjavik.in'];

function allowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return DEFAULT_ORIGINS;
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

type CorsResult = { ok: true; headers: Record<string, string> } | { ok: false };

/** Mirrors the original applyCors: no Origin header (Android) is always allowed. */
function computeCors(req: NextRequest): CorsResult {
  const origin = req.headers.get('origin');
  const list = allowedOrigins();
  const headers: Record<string, string> = {};

  if (!origin) {
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (list.includes('*') || list.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  } else {
    return { ok: false };
  }

  headers['Access-Control-Allow-Headers'] = 'authorization, content-type, x-admin-key, x-device-id, apikey';
  headers['Access-Control-Max-Age'] = '86400';
  return { ok: true, headers };
}

function securityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Cross-Origin-Resource-Policy': 'same-site',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=15552000; includeSubDomains',
  };
}

function applyHeaders(res: NextResponse, headers: Record<string, string>): NextResponse {
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
  return res;
}

type CoreHandler = (req: NextRequest) => Promise<NextResponse>;

/**
 * Wraps a route's core logic: CORS, security headers, optional rate limiting,
 * and a catch-all error handler that guarantees the standard JSON envelope.
 * Body parsing is left to each core handler via the Request's own `.json()`.
 */
export function withApi(
  core: CoreHandler,
  opts: { rateLimit?: { scope: string; max: number; windowMs?: number } } = {}
) {
  return async function handler(req: NextRequest): Promise<NextResponse> {
    const cors = computeCors(req);
    const sec = securityHeaders();

    if (!cors.ok) {
      return applyHeaders(failure(403, 'Origin not allowed.', 'CORS_NOT_ALLOWED'), sec);
    }

    try {
      if (opts.rateLimit) {
        await rateLimit(req, opts.rateLimit);
      }
      const res = await core(req);
      return applyHeaders(res, { ...sec, ...cors.headers });
    } catch (error) {
      if (error instanceof ApiError) {
        return applyHeaders(failure(error.statusCode, error.message, error.errorCode, error.extra), {
          ...sec,
          ...cors.headers,
        });
      }
      logger.error('Unhandled API error', { path: req.url, detail: (error as Error)?.message });
      return applyHeaders(failure(500, 'Internal server error.', 'INTERNAL_ERROR'), {
        ...sec,
        ...cors.headers,
      });
    }
  };
}

/** Returns an OPTIONS handler for the given method list (preflight short-circuit → 204). */
export function handleOptions(methods: string[] = ['GET', 'POST']) {
  const allowed = [...new Set([...methods, 'OPTIONS'])];
  return function optionsHandler(req: NextRequest): NextResponse {
    const cors = computeCors(req);
    const sec = securityHeaders();
    if (!cors.ok) {
      return applyHeaders(failure(403, 'Origin not allowed.', 'CORS_NOT_ALLOWED'), sec);
    }
    const res = new NextResponse(null, { status: 204 });
    return applyHeaders(res, {
      ...sec,
      ...cors.headers,
      'Access-Control-Allow-Methods': allowed.join(','),
    });
  };
}
