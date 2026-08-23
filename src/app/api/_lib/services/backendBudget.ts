import { connectMongo } from '@/lib/db/mongoose';
import { RateLimitBucket, MyraGlobalSettings } from '@/lib/db/models';
import logger from '../utils/logger';

/**
 * Protects the PROJECT's Vercel Function Invocations quota. This is NOT the user's subscription
 * credit system (see myraService.ts) - two completely separate concepts that must never be
 * conflated. A request blocked here never executed, so callers MUST NOT deduct user credit or
 * perform the backend operation when checkBackendBudget() throws.
 *
 * Three independent daily layers, checked in order:
 *   1. GLOBAL - protects the whole project's monthly Vercel quota.
 *   2. USER   - stops one account/device from draining the global budget alone.
 *   3. TOOL   - isolates a runaway loop on one tool from blocking everything else that same
 *               user does (e.g. a bug hammering "open_app" doesn't also lock out "send_whatsapp").
 *
 * Reuses the exact RateLimitBucket collection and atomic-upsert pattern as rateLimit.ts - just
 * with UTC-day windows and userId-based keys instead of per-minute IP keys. No schema change
 * needed; RateLimitBucket's _id is an opaque string, so a new key composition is all this is.
 *
 * IMPORTANT - no circular dependency: every layer's "check" IS its increment (one atomic
 * findOneAndUpdate per layer, exactly like rateLimit.ts). This is a direct MongoDB call from
 * inside the SAME Vercel function invocation that's already running for the route that called
 * this (myra/usage or connectors/[id]/execute) - it is NOT a separate HTTP request to another
 * Vercel endpoint. Calling checkBackendBudget() costs zero additional Vercel invocations.
 *
 * Ordering note: a request rejected at the USER or TOOL layer has already incremented the layers
 * checked before it (e.g. GLOBAL). That's a deliberate small overcount in the SAFE direction -
 * the global counter looks slightly more consumed than requests that actually executed - rather
 * than requiring a multi-document Mongo transaction to avoid it. The 20% safety margin already
 * built into the configured default (15,000/day against a documented 1,000,000/month Hobby cap)
 * covers this.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULT_GLOBAL_LIMIT = 15000;
const DEFAULT_USER_LIMIT = 300;
const DEFAULT_TOOL_LIMIT = 100;

export type BudgetExceededReason = 'GLOBAL' | 'USER' | 'TOOL';

export class BackendBudgetExceededError extends Error {
  reason: BudgetExceededReason;
  resetAt: Date;
  constructor(reason: BudgetExceededReason, resetAt: Date) {
    super(`Backend request budget exhausted (${reason})`);
    this.name = 'BackendBudgetExceededError';
    this.reason = reason;
    this.resetAt = resetAt;
  }
}

function utcDayWindow(now: number): { windowStart: number; resetAt: Date } {
  const windowStart = Math.floor(now / DAY_MS) * DAY_MS;
  return { windowStart, resetAt: new Date(windowStart + DAY_MS) };
}

/** Single atomic check-and-increment for one budget layer. Fails OPEN on a Mongo error, same
 *  policy as rateLimit.ts and for the same reason - a DB hiccup must not take the whole API down
 *  over what's supposed to be a lightweight guard. */
async function checkLayer(
  scope: string,
  identity: string,
  limit: number,
  reason: BudgetExceededReason
): Promise<void> {
  const now = Date.now();
  const { windowStart, resetAt } = utcDayWindow(now);
  const bucketId = `${scope}:${identity}:${windowStart}`;

  let count: number;
  try {
    await connectMongo();
    const doc = await RateLimitBucket.findOneAndUpdate(
      { _id: bucketId },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + DAY_MS + 5000) } },
      { upsert: true, new: true }
    ).lean();
    count = (doc as any).count;
  } catch (error) {
    logger.warn('Backend budget check failed - allowing request through', {
      scope,
      detail: (error as Error)?.message,
    });
    return;
  }

  if (count > limit) {
    throw new BackendBudgetExceededError(reason, resetAt);
  }
}

let cachedLimits: { global: number; user: number; tools: Record<string, number>; fetchedAt: number } | null =
  null;
const LIMITS_CACHE_TTL_MS = 60_000;

/** MyraGlobalSettings is the existing admin-configurable singleton (already backs
 *  discountPercent/disabledConnectors) - these fields extend it rather than adding a new
 *  settings mechanism or env vars. Short in-process cache since this runs on every charging tool
 *  call/connector call but the settings themselves change rarely. */
async function resolveLimits(): Promise<{ global: number; user: number; tools: Record<string, number> }> {
  if (cachedLimits && Date.now() - cachedLimits.fetchedAt < LIMITS_CACHE_TTL_MS) {
    return cachedLimits;
  }
  try {
    await connectMongo();
    const settings = await MyraGlobalSettings.findById('singleton').lean();
    const resolved = {
      global: (settings as any)?.backendDailyRequestLimit ?? DEFAULT_GLOBAL_LIMIT,
      user: (settings as any)?.userBackendDailyRequestLimit ?? DEFAULT_USER_LIMIT,
      tools: ((settings as any)?.toolDailyLimitOverrides as Record<string, number>) ?? {},
      fetchedAt: Date.now(),
    };
    cachedLimits = resolved;
    return resolved;
  } catch (error) {
    logger.warn('Failed to load backend budget limits - using defaults', {
      detail: (error as Error)?.message,
    });
    return { global: DEFAULT_GLOBAL_LIMIT, user: DEFAULT_USER_LIMIT, tools: {} };
  }
}

/**
 * Checks and consumes one unit of backend-request budget across all three layers for `userId`
 * performing `toolName`. Throws BackendBudgetExceededError if any layer is exhausted - the
 * caller's withApi wrapper (see handler.ts) turns this into the 429
 * BACKEND_DAILY_BUDGET_EXHAUSTED / USER_DAILY_BUDGET_EXHAUSTED / TOOL_DAILY_BUDGET_EXHAUSTED
 * contract automatically. Callers must let this throw propagate BEFORE any credit deduction or
 * backend operation - see the doc comment above.
 */
export async function checkBackendBudget(userId: string, toolName: string): Promise<void> {
  const limits = await resolveLimits();
  const toolLimit = limits.tools[toolName] ?? DEFAULT_TOOL_LIMIT;
  await checkLayer('backend-budget-global', 'global', limits.global, 'GLOBAL');
  await checkLayer('backend-budget-user', userId, limits.user, 'USER');
  await checkLayer('backend-budget-tool', `${userId}:${toolName}`, toolLimit, 'TOOL');
}
