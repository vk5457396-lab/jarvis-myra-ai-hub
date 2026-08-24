import { NextRequest } from 'next/server';
import { ApiError } from '../utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { RateLimitBucket } from '@/lib/db/models';
import logger from '../utils/logger';

/**
 * Distributed rate limiter, backed by Mongo instead of an in-memory Map.
 *
 * A per-instance Map cannot actually cap load on Vercel: every warm serverless instance keeps
 * its own independent counter, so the effective limit for one client is `max * (number of warm
 * instances)` - and Vercel scales instance count UP under exactly the traffic spike this is
 * supposed to guard against, weakening the limit precisely when it matters most. This uses a
 * fixed-window counter in Mongo (see RateLimitBucket) so every instance, in every region, agrees
 * on the same count for the same window - the limit holds regardless of how many calls a client
 * makes or how many instances are handling them.
 *
 * Fails OPEN on a Mongo error (logs and allows the request through) rather than closed - a
 * database hiccup rate-limiting every request to 0 would take the whole API down over something
 * that was supposed to be a lightweight guard, which is a worse outage than the one this exists
 * to prevent.
 */
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

  let count: number;
  try {
    await connectMongo();
    const now = Date.now();
    const windowStart = Math.floor(now / window) * window;
    const bucketId = `${key}:${windowStart}`;
    // Every window is its own document, so this upsert is the entire operation - no read-check-
    // write race between two requests landing on different instances in the same window.
    const doc = await RateLimitBucket.findOneAndUpdate(
      { _id: bucketId },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + window + 5000) } },
      { upsert: true, new: true }
    ).lean();
    count = (doc as any).count;
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
 * above. Same fixed-window-document-per-window Mongo pattern (one atomic upsert, no race), just
 * with a single fixed key instead of one keyed by client IP, and a 24h window instead of a
 * per-route one. Window boundaries land on UTC midnight since Date.now() is epoch-ms and the
 * epoch itself starts at UTC midnight, so this resets once per UTC day without needing a cron.
 *
 * Called from middleware.ts on every request, so it fails OPEN on a Mongo error for the same
 * reason rateLimit() does: a DB hiccup should not take the whole site down harder than the outage
 * this exists to prevent.
 */
export async function checkGlobalDailyLimit(
  max: number
): Promise<{ blocked: boolean; count: number }> {
  const window = 86400000; // 24h
  const now = Date.now();
  const windowStart = Math.floor(now / window) * window;
  const bucketId = `global-daily:${windowStart}`;

  try {
    await connectMongo();
    const doc = await RateLimitBucket.findOneAndUpdate(
      { _id: bucketId },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + window + 5000) } },
      { upsert: true, new: true }
    ).lean();
    const count = (doc as any).count;
    return { blocked: count > max, count };
  } catch (error) {
    logger.warn('Global daily limit check failed - allowing request through', {
      detail: (error as Error)?.message,
    });
    return { blocked: false, count: -1 };
  }
}
