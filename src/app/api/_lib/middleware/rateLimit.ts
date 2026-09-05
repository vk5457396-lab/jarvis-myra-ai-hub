import { NextRequest } from 'next/server';
import { ApiError } from '../utils/response';
import { getRedis } from '@/lib/upstash/redis';
import logger from '../utils/logger';

/**
 * Distributed rate limiter, backed by Upstash Redis instead of Mongo (see git history for the
 * Mongo version this replaced - moved off it because a findOneAndUpdate round trip on every
 * matched request, across 70+ routes, was a meaningful chunk of the account's Fluid Active CPU).
 *
 * Same fixed-window-per-key design as before, just with Redis INCR (atomic on a single key,
 * single Redis command) instead of a Mongo atomic upsert. `bucketId` embeds the window's start
 * timestamp, so a new window is simply a new key - nothing to explicitly "reset".
 *
 * EXPIRE is set ONLY on the call that creates the key (INCR's return value is 1), not on every
 * call - a Redis command costs the same whether or not it does anything useful, so re-sending an
 * identical EXPIRE on every one of a window's thousands of calls was pure waste (this is the
 * conditional-EXPIRE optimization; see the earlier unconditional-pipeline version in git history
 * for comparison). This is safe under concurrency: INCR is atomic (Redis executes commands one at
 * a time), so under any number of truly simultaneous callers on a brand-new key, EXACTLY ONE of
 * them will ever observe the return value 1 - that caller, and only that caller, sets the TTL.
 * There is no race where two callers both think they're "first," and no race where nobody sets it.
 *
 * If that one caller's EXPIRE call itself fails (rare - a transient network blip between the
 * already-successful INCR and the follow-up EXPIRE), the key is left without a TTL and lives in
 * Redis until manually cleaned up. This is a storage-cleanup nit, NOT a rate-limiting correctness
 * issue: window identity comes from the key name (which still changes every window regardless of
 * TTL), so the limit keeps working correctly either way. Failing the whole check in this case
 * would be wrong in both directions - it must NOT be folded into the fail-open path below, because
 * the INCR already succeeded and produced a real, correct count that the caller must enforce
 * against; swallowing it as "fail open" would incorrectly ALLOW a request that should be blocked.
 * So this specific failure is caught and logged right here, and the real count is still returned.
 *
 * The INCR call itself fails OPEN on a Redis error same as before (logs and allows the request
 * through, via the try/catch in each exported function below) rather than closed - a backend
 * hiccup rate-limiting every request to 0 would take the whole API down over something that was
 * supposed to be a lightweight guard, which is a worse outage than the one this exists to prevent.
 */
export async function incrWithWindow(bucketId: string, ttlSeconds: number): Promise<number> {
  const redis = getRedis();
  const count = await redis.incr(bucketId);
  if (count === 1) {
    try {
      await redis.expire(bucketId, ttlSeconds);
    } catch (error) {
      logger.warn('Failed to set TTL on a new rate-limit window key - key will not auto-expire', {
        bucketId,
        detail: (error as Error)?.message,
      });
    }
  }
  return count;
}

function clientKey(req: NextRequest, scope: string): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = (forwarded || '').split(',')[0].trim();
  return `${scope}:${ip || 'unknown'}`;
}

export async function rateLimit(
  req: NextRequest,
  { scope = 'default', max, windowMs }: { scope?: string; max?: number; windowMs?: number } = {}
): Promise<void> {
  const limit = Number(max || process.env.RATE_LIMIT_MAX || 60);
  const window = Number(windowMs || process.env.RATE_LIMIT_WINDOW_MS || 60000);
  const key = clientKey(req, scope);
  const windowStart = Math.floor(Date.now() / window) * window;
  const bucketId = `rl:${key}:${windowStart}`;

  let count: number;
  try {
    count = await incrWithWindow(bucketId, Math.ceil(window / 1000) + 5);
  } catch (error) {
    logger.warn('Rate limit check failed - allowing request through', {
      scope,
      detail: (error as Error)?.message,
    });
    return;
  }

  if (count > limit) {
    throw ApiError.tooMany('Too many requests. Please slow down.', 'RATE_LIMITED');
  }
}

/**
 * Site-wide daily request cap, shared across every client/IP - not per-IP like `rateLimit()`
 * above. Same incrWithWindow helper, just with a single fixed key instead of one keyed by client
 * IP, and a 24h window instead of a per-route one. Window boundaries land on UTC midnight since
 * Date.now() is epoch-ms and the epoch itself starts at UTC midnight, so this resets once per UTC
 * day without needing a cron.
 *
 * Called from middleware.ts on every request, so it fails OPEN on a Redis error for the same
 * reason rateLimit() does: a backend hiccup should not take the whole site down harder than the
 * outage this exists to prevent.
 */
export async function checkGlobalDailyLimit(
  max: number,
  key: string = 'global-daily'
): Promise<{ blocked: boolean; count: number }> {
  const window = 86400000; // 24h
  const windowStart = Math.floor(Date.now() / window) * window;
  const bucketId = `gdl:${key}:${windowStart}`;

  try {
    const count = await incrWithWindow(bucketId, 86400 + 5);
    return { blocked: count > max, count };
  } catch (error) {
    logger.warn('Global daily limit check failed - allowing request through', {
      detail: (error as Error)?.message,
    });
    return { blocked: false, count: -1 };
  }
}

/**
 * ONE global MONTHLY request cap for the entire application, mapped directly to Vercel's real
 * Hobby-plan Function Invocations quota (1,000,000 per calendar month). Not currently wired into
 * middleware.ts (see its own comments) - kept in case a monthly-quota-anchored limit is wanted
 * again. Same incrWithWindow helper, except the window is a real UTC CALENDAR MONTH (28-31 days),
 * which can't be computed by dividing epoch-ms into a fixed-size window the way the daily version
 * does - it's computed from the UTC year/month fields instead, so it rolls over correctly at the
 * real end of each month (including the December -> January year rollover, which Date.UTC handles
 * via month overflow).
 */
export async function checkGlobalMonthlyLimit(
  max: number,
  key: string = 'global-monthly'
): Promise<{ blocked: boolean; count: number }> {
  const now = new Date();
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const monthEnd = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1); // exclusive
  const bucketId = `gml:${key}:${monthStart}`;
  const ttlSeconds = Math.ceil((monthEnd - Date.now()) / 1000) + 5 * 86400;

  try {
    const count = await incrWithWindow(bucketId, ttlSeconds);
    return { blocked: count > max, count };
  } catch (error) {
    logger.warn('Global monthly limit check failed - allowing request through', {
      detail: (error as Error)?.message,
    });
    return { blocked: false, count: -1 };
  }
}
