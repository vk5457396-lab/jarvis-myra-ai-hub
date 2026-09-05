import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

/**
 * Lazy singleton - constructing (and validating env vars for) the client at module-eval time would
 * throw during `next build` on any environment where they aren't set yet (mirrors the lazy-init
 * pattern required for Neon/Postgres clients on Vercel).
 *
 * Deliberately NOT Redis.fromEnv(): that helper reads UPSTASH_REDIS_REST_URL/_TOKEN, but Vercel's
 * Marketplace integration for Upstash injects the older @vercel/kv-compatible names instead -
 * KV_REST_API_URL / KV_REST_API_TOKEN (see `vercel env ls`) - so those are read explicitly here.
 */
export function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
      throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
    }
    _redis = new Redis({
      url,
      token,
      // This gates every matched request (see middleware.ts), and the caller fails OPEN on any
      // error - so a slow failure here is worse than no protection at all: it adds the SDK's
      // default 5-retry exponential backoff (several seconds) to every request during an Upstash
      // outage, right when traffic needs to keep flowing. One retry + a tight per-request timeout
      // bounds the worst case to a fraction of a second before falling through to fail-open.
      retry: { retries: 1, backoff: () => 150 },
      signal: () => AbortSignal.timeout(3000),
    });
  }
  return _redis;
}
