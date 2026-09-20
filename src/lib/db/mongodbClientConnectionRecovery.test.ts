// Run with: npx tsx --env-file=.env --env-file=.env.local --test src/lib/db/mongodbClientConnectionRecovery.test.ts
//
// Same recovery behavior as mongooseConnectionRecovery.test.ts, but for getMongoClientPromise()
// (the raw MongoClient used only by the NextAuth adapter). See that file's header comment for why
// dynamic, cache-busted imports are used instead of static top-level ones.

import test from 'node:test';
import assert from 'node:assert/strict';

const REAL_URI = process.env.MONGODB_URI;
const UNREACHABLE_URI = 'mongodb://127.0.0.1:59999/mongodb_client_recovery_test';

if (!REAL_URI) {
  throw new Error('MONGODB_URI must be set (via .env.local) to run this test.');
}

async function freshClientModule(uri: string) {
  process.env.MONGODB_URI = uri;
  // See mongooseConnectionRecovery.test.ts's identical helper for why this explicit clear is
  // necessary in addition to the cache-busted re-import: globalThis is a process-wide singleton.
  (globalThis as unknown as { __mongoClientPromise?: unknown }).__mongoClientPromise = undefined;
  const mod = await import(`./mongodbClient.ts?recovery-test=${Date.now()}-${Math.random()}`);
  return mod as typeof import('./mongodbClient');
}

test('successful connection is cached: two sequential calls return the same client', async () => {
  const { getMongoClientPromise } = await freshClientModule(REAL_URI);
  const client1 = await getMongoClientPromise();
  const client2 = await getMongoClientPromise();
  assert.strictEqual(client1, client2, 'a second call must reuse the cached client, not open a new one');
  await client1.close();
});

test('concurrent calls before the first resolves share the same in-flight promise', async () => {
  const { getMongoClientPromise } = await freshClientModule(REAL_URI);
  const callA = getMongoClientPromise();
  const callB = getMongoClientPromise();
  const [clientA, clientB] = await Promise.all([callA, callB]);
  assert.strictEqual(clientA, clientB, 'concurrent calls must resolve to the same client object');
  await clientA.close();
});

test('a rejected connection attempt clears the cached promise', async () => {
  const mod = await freshClientModule(UNREACHABLE_URI);
  await assert.rejects(() => mod.getMongoClientPromise());
  const cached = (globalThis as unknown as { __mongoClientPromise?: unknown }).__mongoClientPromise;
  assert.equal(cached, null, 'the cache must be cleared back to null after a rejection');
});

test('the next call after a rejection creates a genuinely fresh attempt (not the stale rejected one)', async () => {
  const mod = await freshClientModule(UNREACHABLE_URI);
  const cacheRef = () => (globalThis as unknown as { __mongoClientPromise?: Promise<unknown> | null }).__mongoClientPromise;

  const first = mod.getMongoClientPromise();
  const firstPromiseRef = cacheRef();
  await assert.rejects(() => first);
  assert.equal(cacheRef(), null, 'cleared after first rejection');

  const second = mod.getMongoClientPromise();
  const secondPromiseRef = cacheRef();
  assert.notStrictEqual(
    secondPromiseRef,
    firstPromiseRef,
    'the second attempt must be a genuinely new promise object, not the first (already-dead) one'
  );
  await assert.rejects(() => second, 'the fresh attempt still fails (same bad URI), proving it was real work, not a fluke');
  assert.equal(cacheRef(), null, 'cleared again after the second rejection too - recovery keeps working repeatedly');
});

test('identity-safe cleanup: a rejection never clears a newer promise installed after it', async () => {
  const mod = await freshClientModule(UNREACHABLE_URI);
  const g = globalThis as unknown as { __mongoClientPromise?: unknown };

  const stale = mod.getMongoClientPromise();
  const sentinel = {};
  g.__mongoClientPromise = sentinel;

  await assert.rejects(() => stale);
  assert.strictEqual(
    g.__mongoClientPromise,
    sentinel,
    "the stale rejection's cleanup must not clobber a newer promise it doesn't own"
  );
});
