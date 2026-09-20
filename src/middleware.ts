import { NextResponse, type NextRequest } from 'next/server';
import { checkGlobalDailyLimit } from './app/api/_lib/middleware/rateLimit';

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

/**
 * TWO independent DAILY request caps, split by traffic class, instead of one shared counter.
 *
 * History: originally ONE global counter covered everything (pages + every /api/ route). On
 * 2026-08-27 real Vercel bot-detection data showed marketing/public pages (/, /pricing, /signup,
 * /login, /download, /image.png, /og-image.png, /features, /products, /demos) running 95-100%
 * bot traffic, while every /api/* route (connectors, myra/bootstrap, auth) measured 0% bot - all
 * real app/website users. With one shared bucket, a bot flood on the homepage alone could exhaust
 * the whole 10K/day budget and 429 real API calls - which is exactly what happened (confirmed via
 * direct Mongo read: 12,199 counted by ~03:00 UTC, cap already tripped, /api/connectors and
 * /api/app/release both blocked while carrying 0% bot traffic). Splitting the counter means a bot
 * flood on the public site can only exhaust the SITE bucket - the APP bucket, and therefore real
 * app functionality, stays unaffected.
 *
 * SITE_DAILY_REQUEST_LIMIT (env: GLOBAL_DAILY_REQUEST_LIMIT, default 10,000) - covers every
 * non-/api/ path: marketing pages, /login, /download, /image.png, /og-image.png, etc. This is the
 * literal "10K/day hard cap" repeatedly, explicitly requested - kept exactly as-is, just narrowed
 * to the traffic class it's actually meant to guard (bot-heavy public pages) instead of everything.
 *
 * APP_DAILY_REQUEST_LIMIT (env: APP_DAILY_REQUEST_LIMIT, default 20,000) - covers every /api/*
 * path (the Android app + any browser calls into the API: connectors, myra/*, app/release, etc).
 * Real measured usage here is ~7.5K/day (well under Vercel's real 1,000,000/month Function
 * Invocations quota, which averages to ~33K/day) - 20K/day gives real growth headroom while still
 * protecting the real Vercel quota from a genuine runaway/abuse spike. This is NOT the same as
 * checkBackendBudget()'s 15,000/day (that's a separate, older per-tool/per-user product guard in
 * backendBudget.ts) - this is purely a Vercel-infrastructure guard, independent error_code
 * (GLOBAL_DAILY_LIMIT_REACHED), never conflated with the subscription credit system.
 *
 * Both cover the FULL calendar UTC day, both COUNT every request reaching this middleware
 * (including 404s/dead-endpoints, since those still cost a real invocation), and both exclude
 * whatever Vercel's CDN serves straight from edge cache without invoking middleware at all.
 * Enforcement is ON by default for both.
 *
 * A calendar-month version of this same counter (checkGlobalMonthlyLimit, mapped to Vercel's real
 * 1,000,000/month Function Invocations quota with a safety margin) still exists in rateLimit.ts
 * but is no longer wired in here - kept in case a monthly-quota-anchored limit is wanted again.
 */
const SITE_DAILY_REQUEST_LIMIT = Number(process.env.GLOBAL_DAILY_REQUEST_LIMIT || 10000);
const APP_DAILY_REQUEST_LIMIT = Number(process.env.APP_DAILY_REQUEST_LIMIT || 20000);
const GLOBAL_DAILY_LIMIT_ENFORCE = process.env.GLOBAL_DAILY_LIMIT_ENFORCE !== 'false';

/**
 * Gates the checkGlobalDailyLimit() call below. Default ON, like every other flag in this file.
 *
 * History: this was a Mongo-backed counter until 2026-09-05. A Mongo connect+upsert on every
 * matched request (every /api/* call plus the public-page list below) pushed the account's Fluid
 * Active CPU to 87% of its Hobby-plan 30-day quota on 2026-08-29 (~32 min of buffer left before
 * Vercel would've paused Functions for up to 30 days), and re-enabling it on a fresh account
 * reproduced the same climb within hours - confirming the cost scaled with traffic, not account
 * age, so it was defaulted OFF as the only safe steady state at the time.
 *
 * checkGlobalDailyLimit() (rateLimit.ts) is now backed by Upstash Redis instead: one INCR, pipelined
 * with one EXPIRE, per call - a single low-latency network round trip with no connection-pool/query
 * planning cost, replacing the Mongo round trip that caused the CPU problem. That removes the
 * original reason for defaulting this OFF, so it's back to ON by default.
 *
 * Bot protection for public pages still stands on its own via the Vercel Firewall Challenge rule
 * (edge-level, runs before middleware, zero Function/CPU cost either way) - this only gates the
 * secondary Redis-backed daily-cap layer. If the Redis-backed cost ever becomes a problem again,
 * set `RATE_LIMIT_TRACKING_ENABLED=false` in Vercel env vars and redeploy.
 */
const RATE_LIMIT_TRACKING_ENABLED = process.env.RATE_LIMIT_TRACKING_ENABLED !== 'false';

/**
 * Session/login-continuity paths the global daily limit must NEVER block, no matter how
 * exhausted the counter is - '/auth/myra' is the Android app's Google-login handoff (redirects
 * into `myra://auth?token=...`; see that route's own comment), '/api/auth/' covers NextAuth plus
 * every mobile session endpoint (login/refresh/logout/me), and '/login' is the page itself.
 * Blocking any of these doesn't just degrade one feature - to a real user it looks exactly like
 * "I got logged out" (API/handoff paths) or "the site is completely broken" (the login page: a
 * bare JSON 429 with no layout/branding, exactly what a real user - or the site owner - hits when
 * trying to sign in on a device/browser that isn't already authenticated, discovered 2026-09-17
 * when the admin account itself got shown this instead of the login form). This exemption is
 * intentionally kept even with the site otherwise hard-capped at 10K/day: the site being mostly
 * unavailable past the cap is an accepted, explicit tradeoff; nobody being able to sign in at all
 * - including the owner - was never one.
 *
 * Still COUNTED by checkGlobalDailyLimit() above (this only skips the 429, not the measurement) -
 * a spike here still shows up in the real daily total.
 */
function isAuthCriticalPath(pathname: string): boolean {
  return pathname === '/auth/myra' || pathname === '/login' || pathname.startsWith('/api/auth/');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (RATE_LIMIT_TRACKING_ENABLED) {
    const isAppApi = pathname.startsWith('/api/');
    const { blocked } = isAppApi
      ? await checkGlobalDailyLimit(APP_DAILY_REQUEST_LIMIT, 'app-daily')
      : await checkGlobalDailyLimit(SITE_DAILY_REQUEST_LIMIT, 'site-daily');
    if (blocked && GLOBAL_DAILY_LIMIT_ENFORCE && !isAuthCriticalPath(pathname)) {
      return NextResponse.json(
        {
          success: false,
          message: 'The application has reached its daily request limit. Please try again after midnight UTC.',
          error_code: 'GLOBAL_DAILY_LIMIT_REACHED',
        },
        { status: 429, headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' } }
      );
    }
  }

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
   * Narrowed on 2026-08-29 from "everything except _next internals" to only the paths that
   * actually need a daily-limit check, after Vercel usage data showed middleware alone was
   * burning 43.1% (1h29m of 1h58m+1h29m total) of the account's Fluid Active CPU - because it
   * ran a Mongo round-trip on literally every request: every static asset, sitemap.xml,
   * robots.txt, unknown 404 paths, all of it, even though the Vercel Firewall Challenge rule
   * already blocks the known bot-heavy public paths at the edge (pre-function, zero CPU cost)
   * before middleware would ever run for them.
   *
   * Now middleware only runs for: every /api/* route (app-daily counting + auth exemption +
   * dead-endpoint handling all still need this) and the exact same public-page list the Firewall
   * Challenge rule covers (site-daily counting, as a second layer in case a page isn't currently
   * in the Firewall list). Everything else - unmatched pages, static files, sitemap, robots.txt,
   * favicons, etc. - now skips middleware entirely and can be served straight from Vercel's edge
   * cache, which also cuts Function Invocations, not just Active CPU.
   */
  matcher: [
    '/api/:path*',
    '/',
    '/pricing',
    '/signup',
    '/image.png',
    '/features',
    '/products',
    '/demos',
    '/download',
    '/login',
    '/og-image.png',
  ],
};
