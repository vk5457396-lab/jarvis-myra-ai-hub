// Run with: npx tsx --env-file=.env --env-file=.env.local --test src/app/api/_lib/middleware/rateLimit.perRoute.test.ts
//
// Exercises the real rateLimit() (per-IP, per-route) against the real dev Upstash Redis. Uses a
// randomized `scope` per test (its identity key), same reason the global-limit tests do: never
// touch a real route's live scope from a test run.

import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { rateLimit } from './rateLimit';
import { getRedis } from '@/lib/upstash/redis';

function uniqueScope(label: string): string {
  return `test-per-route-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function reqFrom(ip: string): NextRequest {
  return new NextRequest('https://example.com/api/whatever', {
    headers: { 'x-forwarded-for': ip },
  });
}

async function cleanup(scope: string): Promise<void> {
  const redis = getRedis();
  const keys = await redis.keys(`rl:${scope}:*`);
  if (keys.length) await redis.del(...keys);
}

test('normal request: a single call under the limit does not throw', async () => {
  const scope = uniqueScope('normal');
  await assert.doesNotReject(() => rateLimit(reqFrom('1.1.1.1'), { scope, max: 5, windowMs: 60000 }));
  await cleanup(scope);
});

test('burst traffic: the (max+1)th call from the same IP within the window throws RATE_LIMITED', async () => {
  const scope = uniqueScope('burst');
  const max = 5;
  const req = reqFrom('2.2.2.2');

  for (let i = 0; i < max; i++) {
    await assert.doesNotReject(() => rateLimit(req, { scope, max, windowMs: 60000 }), `call #${i + 1} should be allowed`);
  }

  await assert.rejects(
    () => rateLimit(req, { scope, max, windowMs: 60000 }),
    (error: any) => error.errorCode === 'RATE_LIMITED',
    `call #${max + 1} should be rate limited`
  );

  await cleanup(scope);
});

test('per-IP isolation: two different IPs in the same scope get independent buckets', async () => {
  const scope = uniqueScope('per-ip');
  const max = 2;
  const reqA = reqFrom('3.3.3.1');
  const reqB = reqFrom('3.3.3.2');

  await rateLimit(reqA, { scope, max, windowMs: 60000 });
  await rateLimit(reqA, { scope, max, windowMs: 60000 });
  // A is now at its limit, but B has made zero calls - B must still be allowed.
  await assert.doesNotReject(() => rateLimit(reqB, { scope, max, windowMs: 60000 }));
  // A's 3rd call must now be blocked.
  await assert.rejects(() => rateLimit(reqA, { scope, max, windowMs: 60000 }));

  await cleanup(scope);
});

test('scope isolation: two different scopes for the same IP do not share a bucket', async () => {
  const scopeA = uniqueScope('scope-a');
  const scopeB = uniqueScope('scope-b');
  const req = reqFrom('4.4.4.4');

  await rateLimit(req, { scope: scopeA, max: 1, windowMs: 60000 });
  // scopeA is now exhausted, but scopeB (different route) must be unaffected.
  await assert.doesNotReject(() => rateLimit(req, { scope: scopeB, max: 1, windowMs: 60000 }));
  await assert.rejects(() => rateLimit(req, { scope: scopeA, max: 1, windowMs: 60000 }));

  await cleanup(scopeA);
  await cleanup(scopeB);
});

test('concurrency: N simultaneous requests from one IP never let the count exceed N (atomic INCR)', async () => {
  const scope = uniqueScope('concurrency');
  const req = reqFrom('5.5.5.5');
  const concurrency = 100;

  const results = await Promise.allSettled(
    Array.from({ length: concurrency }, () => rateLimit(req, { scope, max: concurrency, windowMs: 60000 }))
  );

  assert.ok(
    results.every((r) => r.status === 'fulfilled'),
    'all 100 calls should be allowed since max === concurrency'
  );

  await assert.rejects(() => rateLimit(req, { scope, max: concurrency, windowMs: 60000 }), 'the 101st call must be blocked');

  await cleanup(scope);
});

test('window expiry: a new window resets the count for the same IP/scope', async () => {
  const scope = uniqueScope('window-expiry');
  const req = reqFrom('6.6.6.6');
  const window = 1000; // ms - fixed windows are epoch-aligned, so align to one before asserting

  // Wait until just after a window boundary, so the two "same window" calls below have close to
  // the full window's headroom - otherwise a window boundary could fall between them (they are
  // both async but effectively back-to-back), making this test flaky rather than the
  // implementation wrong.
  await new Promise((resolve) => setTimeout(resolve, window - (Date.now() % window) + 10));

  await rateLimit(req, { scope, max: 1, windowMs: window });
  await assert.rejects(() => rateLimit(req, { scope, max: 1, windowMs: window }), 'still inside the same window');

  await new Promise((resolve) => setTimeout(resolve, window + 200));

  await assert.doesNotReject(
    () => rateLimit(req, { scope, max: 1, windowMs: window }),
    'a new window must start a fresh count'
  );

  await cleanup(scope);
});

test('fails open: an unresolvable identity still allows the request through', async () => {
  // rateLimit() already wraps the Redis call in try/catch and returns normally (no throw) on any
  // backend error (see its implementation) - this documents that contract, since deliberately
  // breaking the Redis connection isn't reproducible from this test without a mocking layer this
  // repo doesn't have.
  const scope = uniqueScope('fails-open-contract');
  await assert.doesNotReject(() => rateLimit(reqFrom('7.7.7.7'), { scope, max: 10000, windowMs: 60000 }));
  await cleanup(scope);
});
