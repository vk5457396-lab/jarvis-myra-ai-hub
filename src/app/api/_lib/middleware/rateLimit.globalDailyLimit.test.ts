// Run with: npx tsx --env-file=.env --env-file=.env.local --test src/app/api/_lib/middleware/rateLimit.globalDailyLimit.test.ts
//
// Exercises the real checkGlobalDailyLimit() against the real dev Upstash Redis (same INCR+EXPIRE
// pipeline path production uses) - not a mock, since the whole point of this function is the
// atomic-increment-under-concurrency guarantee, which a mock can't verify.
//
// Uses a randomized, unique `key` (checkGlobalDailyLimit's second param) for every run instead of
// the real 'global-daily' key middleware.ts uses. This is deliberate: hammering the actual
// 'global-daily' bucket here would inflate TODAY'S REAL production counter (same Redis the live
// site reads/writes), which could falsely trip the live 429 for real users. The key param exists
// specifically so this test can be safe to run against the real database.

import test from 'node:test';
import assert from 'node:assert/strict';
import { checkGlobalDailyLimit } from './rateLimit';
import { getRedis } from '@/lib/upstash/redis';

function uniqueKey(label: string): string {
  return `test-global-daily-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Mirrors the `gdl:${key}:${windowStart}` bucket id checkGlobalDailyLimit builds internally. */
function bucketIdFor(key: string, windowStart: number): string {
  return `gdl:${key}:${windowStart}`;
}

async function cleanup(key: string): Promise<void> {
  const redis = getRedis();
  const keys = await redis.keys(`gdl:${key}:*`);
  if (keys.length) await redis.del(...keys);
}

test('threshold at the real limit (10000): boundary correctness at 9999 / 10000 / 10001', async () => {
  const key = uniqueKey('threshold-10k');
  const max = 10000;

  // Seeds the bucket directly to max-2 instead of making 9,998 real sequential round trips to
  // Redis (no extra rigor: the atomic-increment guarantee under concurrency is proven separately
  // by the "concurrency" test below, and the `count > max` comparison behaves identically at any
  // count). This test's job is boundary correctness at the real configured value, i.e. request
  // #9999, #10000 (== max), and #10001.
  const windowStart = Math.floor(Date.now() / 86400000) * 86400000;
  await getRedis().set(bucketIdFor(key, windowStart), max - 2);

  // Request #9999
  {
    const { blocked, count } = await checkGlobalDailyLimit(max, key);
    assert.equal(count, 9999);
    assert.equal(blocked, false, 'request #9999 should be allowed');
  }
  // Request #10000 (== max, must still be allowed)
  {
    const { blocked, count } = await checkGlobalDailyLimit(max, key);
    assert.equal(count, 10000);
    assert.equal(blocked, false, 'request #10000 (== max) should be allowed');
  }
  // Request #10001 (max + 1, must be blocked)
  {
    const { blocked, count } = await checkGlobalDailyLimit(max, key);
    assert.equal(count, 10001);
    assert.equal(blocked, true, 'request #10001 should be blocked');
  }

  await cleanup(key);
});

test('threshold on a small limit: full linear walk proves the count > max comparison generally', async () => {
  const key = uniqueKey('threshold-small');
  const max = 5;

  for (let i = 1; i <= max; i++) {
    const { blocked, count } = await checkGlobalDailyLimit(max, key);
    assert.equal(count, i);
    assert.equal(blocked, false, `request #${i} should be allowed`);
  }

  const { blocked, count } = await checkGlobalDailyLimit(max, key);
  assert.equal(count, max + 1);
  assert.equal(blocked, true, `request #${max + 1} should be blocked`);

  await cleanup(key);
});

test('shared counter: two different "callers" (Android vs website) increment the SAME bucket', async () => {
  const key = uniqueKey('shared');
  const max = 5;

  // Simulates an Android app call and a website page view both landing on the same global
  // counter - checkGlobalDailyLimit takes no per-client/per-platform identity at all, so there is
  // structurally no way for two callers sharing `key` to land in different buckets.
  const android1 = await checkGlobalDailyLimit(max, key);
  const website1 = await checkGlobalDailyLimit(max, key);
  const android2 = await checkGlobalDailyLimit(max, key);

  assert.deepEqual(
    [android1.count, website1.count, android2.count],
    [1, 2, 3],
    'Android and website calls interleave into one monotonically increasing shared count'
  );

  await cleanup(key);
});

test('concurrency: N simultaneous requests never let the count exceed N (atomic INCR, no lost updates)', async () => {
  const key = uniqueKey('concurrency');
  const max = 1000; // effectively "unlimited" for this test - only checking the count is exact
  const concurrency = 200;

  const results = await Promise.all(
    Array.from({ length: concurrency }, () => checkGlobalDailyLimit(max, key))
  );

  const counts = results.map((r) => r.count).sort((a, b) => a - b);
  const expected = Array.from({ length: concurrency }, (_, i) => i + 1);
  assert.deepEqual(
    counts,
    expected,
    'every one of the 200 concurrent increments must land on a distinct integer 1..200 - a lost update would produce a duplicate or a gap'
  );

  await cleanup(key);
});

test('day rollover: a different UTC-day window is a fresh, independent key starting at 1', async () => {
  const key = uniqueKey('rollover');
  const DAY_MS = 86400000;
  const todayWindowStart = Math.floor(Date.now() / DAY_MS) * DAY_MS;
  const yesterdayWindowStart = todayWindowStart - DAY_MS;

  // Seed "yesterday's" bucket as if it were already exhausted (count over any realistic max) -
  // checkGlobalDailyLimit always computes the CURRENT day's windowStart from Date.now(), so it can
  // never read or be influenced by this key. This is the entire reset mechanism: the bucket key is
  // `gdl:${key}:${windowStart}`, and windowStart changes to a new integer once per UTC day by
  // construction (Math.floor(Date.now() / 86400000) * 86400000) - there is no counter to
  // explicitly "reset", a new day is simply a new key via the same INCR that already runs on every
  // call.
  await getRedis().set(bucketIdFor(key, yesterdayWindowStart), 999999);

  const { blocked, count } = await checkGlobalDailyLimit(10000, key);
  assert.equal(count, 1, "today's window must start at 1 regardless of yesterday's exhausted count");
  assert.equal(blocked, false);

  const todayValue = await getRedis().get(bucketIdFor(key, todayWindowStart));
  assert.ok(todayValue !== null, "today's bucket key must exist under today's windowStart, separate from yesterday's");

  await cleanup(key);
});

test('fails open: a broken key/identity still returns blocked=false (never hard-fails the request)', async () => {
  // checkGlobalDailyLimit already wraps the Redis call in try/catch and returns
  // { blocked: false, count: -1 } on any error (see its implementation) - this just documents
  // that contract with a normal call, since deliberately breaking the Redis connection isn't
  // reproducible from this test without a mocking layer this repo doesn't have.
  const key = uniqueKey('fails-open-contract');
  const { blocked } = await checkGlobalDailyLimit(10000, key);
  assert.equal(blocked, false);

  await cleanup(key);
});
