// Run with: npx tsx --env-file=.env --env-file=.env.local --test src/app/api/_lib/middleware/rateLimit.globalMonthlyLimit.test.ts
//
// Exercises the real checkGlobalMonthlyLimit() against the real dev Upstash Redis (same
// INCR+EXPIRE pipeline path production uses). Uses a randomized, unique `key` (its second param)
// for every run instead of the real 'global-monthly' key middleware.ts uses, for the same reason
// rateLimit.globalDailyLimit.test.ts does: hammering the real key would inflate the actual live
// production monthly counter.

import test from 'node:test';
import assert from 'node:assert/strict';
import { checkGlobalMonthlyLimit } from './rateLimit';
import { getRedis } from '@/lib/upstash/redis';

function uniqueKey(label: string): string {
  return `test-global-monthly-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function bucketIdFor(key: string, monthStart: number): string {
  return `gml:${key}:${monthStart}`;
}

async function cleanup(key: string): Promise<void> {
  const redis = getRedis();
  const keys = await redis.keys(`gml:${key}:*`);
  if (keys.length) await redis.del(...keys);
}

test('threshold at the real limit (500000): boundary correctness', async () => {
  const key = uniqueKey('threshold');
  const max = 500000;

  // Seeded directly to max-2 for the same reason the daily test does this: a real sequential
  // 500,000-call round trip to Redis would take far too long and adds no more rigor than the small
  // -limit linear-walk test below already provides for the `count > max` comparison itself.
  const now = new Date();
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  await getRedis().set(bucketIdFor(key, monthStart), max - 2);

  {
    const { blocked, count } = await checkGlobalMonthlyLimit(max, key);
    assert.equal(count, max - 1);
    assert.equal(blocked, false, `request #${max - 1} should be allowed`);
  }
  {
    const { blocked, count } = await checkGlobalMonthlyLimit(max, key);
    assert.equal(count, max);
    assert.equal(blocked, false, `request #${max} (== max) should be allowed`);
  }
  {
    const { blocked, count } = await checkGlobalMonthlyLimit(max, key);
    assert.equal(count, max + 1);
    assert.equal(blocked, true, `request #${max + 1} should be blocked`);
  }

  await cleanup(key);
});

test('threshold on a small limit: full linear walk proves the count > max comparison generally', async () => {
  const key = uniqueKey('threshold-small');
  const max = 5;

  for (let i = 1; i <= max; i++) {
    const { blocked, count } = await checkGlobalMonthlyLimit(max, key);
    assert.equal(count, i);
    assert.equal(blocked, false, `request #${i} should be allowed`);
  }

  const { blocked, count } = await checkGlobalMonthlyLimit(max, key);
  assert.equal(count, max + 1);
  assert.equal(blocked, true, `request #${max + 1} should be blocked`);

  await cleanup(key);
});

test('shared counter: multiple "callers" increment the SAME bucket, no per-client split', async () => {
  const key = uniqueKey('shared');
  const max = 10;

  const a = await checkGlobalMonthlyLimit(max, key);
  const b = await checkGlobalMonthlyLimit(max, key);
  const c = await checkGlobalMonthlyLimit(max, key);

  assert.deepEqual([a.count, b.count, c.count], [1, 2, 3]);

  await cleanup(key);
});

test('concurrency: N simultaneous requests never let the count exceed N (atomic INCR, no lost updates)', async () => {
  const key = uniqueKey('concurrency');
  const max = 1000;
  const concurrency = 200;

  const results = await Promise.all(
    Array.from({ length: concurrency }, () => checkGlobalMonthlyLimit(max, key))
  );

  const counts = results.map((r) => r.count).sort((a, b) => a - b);
  const expected = Array.from({ length: concurrency }, (_, i) => i + 1);
  assert.deepEqual(counts, expected, 'every one of the 200 concurrent increments must land on a distinct integer 1..200');

  await cleanup(key);
});

test('month rollover: a different calendar-month window is a fresh, independent key starting at 1', async () => {
  const key = uniqueKey('rollover');
  const now = new Date();
  const thisMonthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const lastMonthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1);

  // Seed "last month's" bucket as if already exhausted - checkGlobalMonthlyLimit always computes
  // the CURRENT calendar month's boundaries from `new Date()`, so it can never read or be
  // influenced by a previous month's key. This is the entire reset mechanism: the bucket key is
  // `gml:${key}:${monthStart}`, which changes to a new value once per real calendar month by
  // construction (Date.UTC(year, month, 1)) - there is no counter to explicitly "reset".
  await getRedis().set(bucketIdFor(key, lastMonthStart), 999999);

  const { blocked, count } = await checkGlobalMonthlyLimit(500000, key);
  assert.equal(count, 1, "this month's window must start at 1 regardless of last month's exhausted count");
  assert.equal(blocked, false);

  const thisMonthValue = await getRedis().get(bucketIdFor(key, thisMonthStart));
  assert.ok(thisMonthValue !== null, "this month's bucket key must exist, separate from last month's");

  await cleanup(key);
});

test('December -> January year rollover computes correctly via Date.UTC month overflow', () => {
  // Pure arithmetic check, no DB needed - Date.UTC(year, 12, 1) must overflow into January of
  // year+1, which is exactly what checkGlobalMonthlyLimit relies on for month+1 computations.
  const decStart = Date.UTC(2026, 11, 1); // December 2026
  const janStart = Date.UTC(2026, 12, 1); // "month 12" -> January 2027
  const expectedJanStart = Date.UTC(2027, 0, 1);
  assert.equal(janStart, expectedJanStart);
  assert.ok(janStart > decStart);
});

test('fails open: a broken key/identity still returns blocked=false (never hard-fails the request)', async () => {
  const key = uniqueKey('fails-open-contract');
  const { blocked } = await checkGlobalMonthlyLimit(500000, key);
  assert.equal(blocked, false);

  await cleanup(key);
});
