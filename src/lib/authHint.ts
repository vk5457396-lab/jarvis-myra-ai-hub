/**
 * Signed-out visitors don't need /api/auth/session.
 *
 * SessionProvider calls /api/auth/session on every page load, and it was the #1 Function in
 * production logs (2026-10-01) even though most visitors are signed out. The auth route keeps a
 * readable `cnv_auth` cookie in step with the real httpOnly session cookie (see
 * app/api/auth/[...nextauth]/route.ts). When it says "0" this answers the session request locally
 * with `null` — exactly what the server would return — so nothing about useSession changes.
 *
 * No cookie yet (first visit, or signed in before this existed) or "1" → the real request goes
 * out, and its response sets the cookie for next time. Signing in sets it to 1 before next-auth
 * refetches the session, so login is never hidden.
 */
export const AUTH_HINT_COOKIE = "cnv_auth";

export function installAuthHintFetch() {
  if (typeof window === "undefined" || (window as any).__cnvAuthHint) return;
  (window as any).__cnvAuthHint = true;

  const realFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
      if (
        method === "GET" &&
        new URL(url, location.href).pathname === "/api/auth/session" &&
        document.cookie.split("; ").includes(`${AUTH_HINT_COOKIE}=0`)
      ) {
        return Promise.resolve(new Response("null", { status: 200, headers: { "content-type": "application/json" } }));
      }
    } catch {
      // fall through to the real request
    }
    return realFetch(input, init);
  };
}
