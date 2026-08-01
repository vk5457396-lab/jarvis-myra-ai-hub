import { ApiError } from '../_utils/response.js';

/**
 * Best-effort in-memory rate limiter. Serverless instances are short lived, so
 * this throttles bursts per warm instance without any external dependency.
 */
const buckets = new Map();

function clientKey(req, scope) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded || '')
    .split(',')[0]
    .trim();
  return `${scope}:${ip || req.socket?.remoteAddress || 'unknown'}`;
}

export function rateLimit(req, { scope = 'default', max, windowMs } = {}) {
  const limit = Number(max || process.env.RATE_LIMIT_MAX || 60);
  const window = Number(windowMs || process.env.RATE_LIMIT_WINDOW_MS || 60000);
  const key = clientKey(req, scope);
  const now = Date.now();

  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + window });
    return;
  }

  entry.count += 1;
  if (entry.count > limit) {
    throw ApiError.tooMany('Too many requests. Please slow down.', 'RATE_LIMITED');
  }

  // Opportunistic cleanup so the map cannot grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }
}
