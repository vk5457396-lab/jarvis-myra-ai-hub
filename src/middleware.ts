import { NextResponse, type NextRequest } from 'next/server';

/**
 * Edge-level block for confirmed-dead endpoints only - runs before the request ever reaches a
 * Node.js Function, so a hit here costs a lightweight middleware invocation instead of a full
 * serverless invocation (Mongo connection pool init, JWT verify, etc).
 *
 * /api/myra/heartbeat was deliberately disabled in the route itself (see that file's comment -
 * commits 41d78c4/d1b13da: the Android app's MyraRepository stopped calling it, handler is
 * already auth-free/DB-free and just echoes a static response). It remains the single highest-
 * volume path in production Vercel logs purely from stale/un-updated app installs still firing
 * their old heartbeat interval at a dead target - this stops paying even the disabled handler's
 * invocation cost for that traffic. Response shape matches the [...path] catch-all's 404 envelope
 * so any caller's existing "not found" handling still applies unchanged.
 */
const DEAD_ENDPOINTS = new Set(['/api/myra/heartbeat']);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (DEAD_ENDPOINTS.has(pathname)) {
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST,OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, content-type, x-admin-key, x-device-id, apikey',
        },
      });
    }
    return NextResponse.json(
      { success: false, message: 'Endpoint not found.', error_code: 'ENDPOINT_NOT_FOUND', path: pathname },
      { status: 404, headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/myra/heartbeat'],
};
