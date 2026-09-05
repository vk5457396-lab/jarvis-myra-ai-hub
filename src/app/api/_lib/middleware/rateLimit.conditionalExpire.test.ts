// Run with: npx tsx --env-file=.env --env-file=.env.local --test src/app/api/_lib/middleware/rateLimit.conditionalExpire.test.ts
//
// Targeted tests for the conditional-EXPIRE optimization in incrWithWindow(): EXPIRE should fire
// only on the call that creates the key (INCR returns 1), never on subsequent calls. Exercises the
// real dev Upstash Redis, same reason every other test file in this directory does - the whole
// point is the atomic-first-writer guarantee under concurrency, which a mock can't verify.

import test from 'node:test';
import assert from 'node:assert/strict';
import { incrWithWindow } from './rateLimit';
import { getRedis } from '@/lib/upstash/redis';

function uniqueBucket(label: string): string {
  return `test-cond-expire-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

test('first increment sets TTL on the new key', async () => {
  const bucket = uniqueBucket('first-sets-ttl');
  const redis = getRedis();

  assert.equal(await redis.ttl(bucket), -2, 'sanity check: key must not exist yet (-2 = no such key)');

  const count = await incrWithWindow(bucket, 120);
  assert.equal(count, 1);

  const ttl = await redis.ttl(bucket);
  assert.ok(ttl > 0 && ttl <= 120, `TTL must be set and within the requested window, got ${ttl}`);

  await redis.del(bucket);
});

test('subsequent increments do not reissue EXPIRE (TTL is left alone)', async () => {
  const bucket = uniqueBucket('no-reissue');
  const redis = getRedis();

  await incrWithWindow(bucket, 120); // count 1 - sets TTL to ~120
  // Deliberately shrink the TTL to a distinctive low value. If a later call incorrectly reissues
  // EXPIRE with the original 120s window, this sentinel would be overwritten back up to ~120 -
  // the exact bug this optimization must not reintroduce in reverse (i.e. must not KEEP paying
  // for EXPIRE on every call, which unconditional-EXPIRE would reveal here as a reset to ~120).
  await redis.expire(bucket, 5);

  const count2 = await incrWithWindow(bucket, 120); // count 2 - must NOT touch TTL
  assert.equal(count2, 2);

  const ttlAfter = await redis.ttl(bucket);
  assert.ok(ttlAfter > 0 && ttlAfter <= 5, `intermediate call must not reset TTL - expected <=5, got ${ttlAfter}`);

  await redis.del(bucket);
});

test('concurrent first increments: exactly one first-writer sets the TTL, no lost updates', async () => {
  const bucket = uniqueBucket('concurrent-first-writer');
  const redis = getRedis();
  const concurrency = 50;

  const counts = await Promise.all(Array.from({ length: concurrency }, () => incrWithWindow(bucket, 90)));
  const sorted = [...counts].sort((a, b) => a - b);
  const expected = Array.from({ length: concurrency }, (_, i) => i + 1);
  assert.deepEqual(
    sorted,
    expected,
    'every concurrent increment must land on a distinct integer 1..N - proves INCR atomicity held even while some caller was also setting TTL'
  );

  // Whichever single caller observed count === 1 must have successfully set the TTL - if the
  // "first" branch were somehow reached by more than one caller, or by none, this would either be
  // fine (idempotent EXPIRE) or missing (TTL -1 = no expiry). Either way, a duplicate first-writer
  // cannot corrupt the count (already proven above); this confirms the TTL side-effect also landed.
  const ttl = await redis.ttl(bucket);
  assert.ok(ttl > 0 && ttl <= 90, `exactly one first-writer must have set a valid TTL, got ${ttl}`);

  await redis.del(bucket);
});

test('INCR-success / EXPIRE-failure: the real count is still returned, not swallowed into fail-open', async () => {
  // NaN is not a valid EXPIRE argument (Redis requires an integer), so this forces the internal
  // `redis.expire()` call to fail on a REAL Upstash error (not a mock) while the preceding INCR
  // still succeeds - exactly the rare failure mode this optimization introduces. (A negative TTL
  // was tried first and rejected as a test vector: Redis treats a negative EXPIRE as "delete the
  // key immediately," which is a valid operation, not an error - it doesn't exercise this path.)
  //
  // The function must not throw, and must still return the true, correct count so the caller
  // enforces the real limit - swallowing this into "blocked: false, count: -1" would incorrectly
  // ALLOW a request that should count against the limit.
  const bucket = uniqueBucket('incr-ok-expire-fails');
  const redis = getRedis();

  const count = await incrWithWindow(bucket, NaN);
  assert.equal(count, 1, 'the real INCR result must still be returned even though EXPIRE failed');

  const value = await redis.get(bucket);
  assert.equal(Number(value), 1, 'the increment itself must have taken effect in Redis, unaffected by the EXPIRE failure');

  // Document the tradeoff: without a valid TTL ever having been set, the key has no expiry.
  const ttl = await redis.ttl(bucket);
  assert.equal(ttl, -1, 'no TTL was set (the documented storage-cleanup tradeoff, not a correctness issue)');

  await redis.del(bucket);
});
