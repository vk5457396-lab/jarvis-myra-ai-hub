import { NextResponse, type NextRequest } from 'next/server';
import { checkGlobalDailyLimit } from './app/api/_lib/middleware/rateLimit';

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

/**
 * Hard cap on the public MARKETING SITE only (/, /pricing, /products, /features, /demos, /login,
 * /signup, admin pages, etc) - once total page views cross this in a UTC day, every further page
 * request gets a flat 429 instead of reaching any route. Added because traffic volume there was
 * burning through the Vercel plan's request budget. See checkGlobalDailyLimit in rateLimit.ts for
 * the shared Mongo counter this reads/increments (same fixed-window-document pattern as the
 * existing per-IP rateLimit(), just one global key instead of one per client).
 *
 * Deliberately EXCLUDES everything under /api/ (see the pathname.startsWith('/api/') guard below)
 * - the Android app's subscription/usage/tool-execution traffic lives there, and it already has
 * its own purpose-built protection: checkBackendBudget() in backendBudget.ts (15,000/day global,
 * 300/day per-user, 100/day per-tool) plus the per-IP rateLimit() on individual routes. Folding
 * app traffic into this same 1000/day bucket as marketing-page views would starve real users of
 * their subscription/tool calls the moment the marketing site got any meaningful traffic - a
 * false "credit exhausted"-looking failure that has nothing to do with their actual subscription
 * credit (myraService.ts) or backend budget. Keep these two limiters scoped to what they each
 * protect; do not merge them.
 *
 * Override via env without a redeploy if 1000 turns out to be too tight or too loose.
 */
const DAILY_REQUEST_LIMIT = Number(process.env.SITE_DAILY_REQUEST_LIMIT || 1000);

export async function middleware(req: NextRequest) {
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

  if (!pathname.startsWith('/api/')) {
    const { blocked } = await checkGlobalDailyLimit(DAILY_REQUEST_LIMIT);
    if (blocked) {
      return NextResponse.json(
        {
          success: false,
          message: 'Site has reached its daily request limit. Please try again after midnight UTC.',
          error_code: 'SITE_DAILY_LIMIT_REACHED',
        },
        { status: 429, headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  runtime: 'nodejs',
  // Everything except Next's own build/image internals and the favicon - those aren't real
  // page/API hits and would otherwise burn part of the budget just re-rendering the block page.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
