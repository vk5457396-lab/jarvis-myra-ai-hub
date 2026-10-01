/**
 * Client-side cache for public JSON endpoints (release info, reviews, the offer banner).
 *
 * Every page view used to refetch these, and several components on one page each fetched the same
 * URL — each one a CDN request, and a Function run whenever the CDN copy was stale. This keeps one
 * copy per browser tab for `ttlMs` (sessionStorage, so it survives full page loads) and shares a
 * single in-flight request between components that ask at the same time.
 *
 * Only for data that is the same for everyone — never per-user responses.
 */
const inflight = new Map<string, Promise<unknown>>();
const PREFIX = "cnv-json:";

function readStored<T>(url: string, ttlMs: number): T | undefined {
  try {
    const raw = sessionStorage.getItem(PREFIX + url);
    if (!raw) return undefined;
    const { at, body } = JSON.parse(raw);
    return Date.now() - at < ttlMs ? (body as T) : undefined;
  } catch {
    return undefined;
  }
}

export function cachedJson<T = any>(url: string, ttlMs: number): Promise<T> {
  const stored = readStored<T>(url, ttlMs);
  if (stored !== undefined) return Promise.resolve(stored);

  const pending = inflight.get(url);
  if (pending) return pending as Promise<T>;

  const request = fetch(url)
    .then((res) => res.json())
    .then((body) => {
      // Only cache successful envelopes, so a transient error isn't remembered.
      if (body?.success) {
        try {
          sessionStorage.setItem(PREFIX + url, JSON.stringify({ at: Date.now(), body }));
        } catch {
          // storage full/blocked — the in-memory dedupe still helps
        }
      }
      return body as T;
    })
    .finally(() => inflight.delete(url));
  inflight.set(url, request);
  return request;
}

/** Drop a cached URL (e.g. after the user posts a review) so the next read goes to the network. */
export function forgetCachedJson(url: string) {
  try {
    sessionStorage.removeItem(PREFIX + url);
  } catch {
    // ignore
  }
}
