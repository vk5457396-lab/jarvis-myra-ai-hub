export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import { handlers } from '@/lib/auth/config';
import { AUTH_HINT_COOKIE } from '@/lib/authHint';

/**
 * Keeps a readable `cnv_auth` hint cookie (1 = signed in, 0 = signed out) in step with the real,
 * httpOnly session cookie, so the browser can skip /api/auth/session for signed-out visitors (see
 * lib/authHint). It holds no secret — it only says whether checking is worth a request.
 */
function withAuthHint(res: Response, signedIn: boolean | null): Response {
  if (signedIn === null) return res;
  const headers = new Headers(res.headers);
  headers.append(
    'set-cookie',
    `${AUTH_HINT_COOKIE}=${signedIn ? '1' : '0'}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax; Secure`
  );
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

/** What the response's Set-Cookie headers do to the session cookie: set it, clear it, or neither. */
function sessionCookieChange(res: Response): boolean | null {
  const cookies = res.headers.getSetCookie?.() ?? [];
  for (const c of cookies) {
    const m = /^(?:__Secure-)?authjs\.session-token(?:\.\d+)?=([^;]*)/.exec(c);
    if (!m) continue;
    const cleared = !m[1] || /max-age=0/i.test(c) || /expires=thu, 01 jan 1970/i.test(c);
    return !cleared;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const res = await handlers.GET(req);
  if (req.nextUrl.pathname.endsWith('/session')) {
    try {
      const body = await res.clone().json();
      return withAuthHint(res, Boolean(body?.user));
    } catch {
      return res;
    }
  }
  // OAuth callbacks (Google) set the session cookie on a GET redirect.
  return withAuthHint(res, sessionCookieChange(res));
}

export async function POST(req: NextRequest) {
  const res = await handlers.POST(req);
  // Credentials sign-in sets the session cookie; sign-out clears it.
  return withAuthHint(res, sessionCookieChange(res));
}
