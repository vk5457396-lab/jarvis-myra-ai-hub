import { NextResponse, type NextRequest } from 'next/server';

/**
 * Edge-level block for confirmed-dead endpoints only - runs before the request ever reaches a
 * Node.js Function, so a hit here costs a lightweight middleware invocation instead of a full
 * serverless invocation (Mongo connection pool init, JWT verify, etc).
 *
 * 2026-09-01: extended from just /api/myra/heartbeat to every non-auth Myra-app endpoint
 * (MyraRepository on the Android side already turned all of these into local no-ops - see that
 * file's `disabled()` comment - so only stale/un-updated app installs still built against the
 * old MyraApi.kt hit these paths at all). Explicitly kept OUT of this list, on request: the
 * app-update-check/download pair (/api/app/release, /api/app/release/download) so old installs
 * can still discover and fetch the update; every /api/auth/* login/session endpoint so existing
 * sessions and the login page keep working; and /api/notification/* since that's how a push
 * telling stale installs to update actually reaches them. Response shape matches the [...path]
 * catch-all's 404 envelope so any caller's existing "not found" handling still applies unchanged.
 */
const DEAD_ENDPOINTS_EXACT = new Set([
  '/api/myra/heartbeat',
  '/api/myra/bootstrap',
  '/api/myra/profile',
  '/api/myra/banner/active',
  '/api/myra/username/check',
  '/api/myra/username',
  '/api/myra/users/search',
  '/api/myra/users/all',
  '/api/myra/firebase-token',
  '/api/myra/chat/notify',
  '/api/myra/referrals/redeem',
  '/api/myra/devices',
  '/api/myra/settings',
  '/api/myra/usage',
  '/api/myra/subscription',
  '/api/myra/subscription/order',
  '/api/myra/subscription/verify',
  '/api/myra/access-key/redeem',
  '/api/myra/automation-error',
  '/api/myra/telemetry-event',
  '/api/connectors',
]);

/** /api/connectors/{id}/connect|disconnect|refresh|execute - dynamic id segment, so prefix-matched
 *  rather than listed individually in DEAD_ENDPOINTS_EXACT. */
function isDeadEndpoint(pathname: string): boolean {
  return DEAD_ENDPOINTS_EXACT.has(pathname) || pathname.startsWith('/api/connectors/');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isDeadEndpoint(pathname)) {
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
  runtime: 'nodejs',
  /**
   * Only the dead endpoints. With the global daily cap gone, blocking these is middleware's only
   * job — running it on pages, /image.png (the favicon) and every /api route was costing a
   * Function Invocation on ~60% of all requests (production logs, 2026-09-30) and kept
   * CDN-cacheable responses like /api/app/release from being served straight from the edge.
   * Must stay a literal list (Next.js reads it statically) — keep in sync with
   * DEAD_ENDPOINTS_EXACT above.
   */
  matcher: [
    '/api/myra/heartbeat',
    '/api/myra/bootstrap',
    '/api/myra/profile',
    '/api/myra/banner/active',
    '/api/myra/username/check',
    '/api/myra/username',
    '/api/myra/users/search',
    '/api/myra/users/all',
    '/api/myra/firebase-token',
    '/api/myra/chat/notify',
    '/api/myra/referrals/redeem',
    '/api/myra/devices',
    '/api/myra/settings',
    '/api/myra/usage',
    '/api/myra/subscription',
    '/api/myra/subscription/order',
    '/api/myra/subscription/verify',
    '/api/myra/access-key/redeem',
    '/api/myra/automation-error',
    '/api/myra/telemetry-event',
    '/api/connectors',
    '/api/connectors/:path*',
  ],
};
