import { Schema, model, models, type Model } from 'mongoose';

/**
 * Fixed-window distributed rate-limit counter - see ../../../app/api/_lib/middleware/rateLimit.ts
 * for why this replaced an in-memory Map. `_id` is `${scope}:${identity}:${windowStartMs}`, so
 * every window is its own document and the increment is a single atomic upsert - no read-then-
 * write race between concurrent requests hitting different serverless instances at once, which
 * is exactly the case an in-memory-per-instance counter cannot handle. The TTL index reclaims
 * each window's document shortly after it closes; nothing else ever deletes these.
 */
const rateLimitBucketSchema = new Schema(
  {
    _id: { type: String, required: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false, collection: 'rate_limit_buckets' }
);
rateLimitBucketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimitBucket: Model<any> =
  models.RateLimitBucket || model('RateLimitBucket', rateLimitBucketSchema);
