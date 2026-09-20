// Run with: npx tsx --env-file=.env --env-file=.env.local --test src/lib/db/mongooseConnectionRecovery.test.ts
//
// Exercises connectMongo()'s rejected-promise cache recovery. Both the happy path (real dev
// Atlas cluster - a connection attempt doesn't modify any data, so this is safe) and the
// failure/retry path (an intentionally unreachable local URI, chosen so the connection is
// refused near-instantly instead of hanging on a 30s server-selection timeout) are exercised.
//
// mongoose.ts reads process.env.MONGODB_URI once at module top-level, and ESM `import`
// statements are hoisted above any other code in the file - so each scenario group that needs a
// different MONGODB_URI value gets its own fresh module instance via a cache-busting dynamic
// import (?t=<unique>), set up AFTER assigning the env var for that group.

import test from 'node:test';
import assert from 'node:assert/strict';

const REAL_URI = process.env.MONGODB_URI;
// Nothing listens on this port on localhost, so the OS refuses the connection immediately -
// fails fast, no network/DNS delay, unlike a genuinely unreachable Atlas host would.
const UNREACHABLE_URI = 'mongodb://127.0.0.1:59999/mongoose_recovery_test';

if (!REAL_URI) {
  throw new Error('MONGODB_URI must be set (via .env.local) to run this test.');
}

async function freshMongooseModule(uri: string) {
  process.env.MONGODB_URI = uri;
  // globalThis is a true process-wide singleton - a cache-busted re-import gives a fresh module
  // namespace (so MONGODB_URI is re-captured), but every instance of connectMongo() still reads
  // and writes the SAME __mongooseCache unless it's explicitly cleared here too. Without this,
  // a prior test's real successful connection would still be sitting in the cache and get
  // returned immediately, without a fresh connectMongo() ever actually attempting anything.
  (globalThis as unknown as { __mongooseCache?: unknown }).__mongooseCache = undefined;
  const mod = await import(`./mongoose.ts?recovery-test=${Date.now()}-${Math.random()}`);
  return mod as typeof import('./mongoose');
}

test('successful connection is cached: two sequential calls return the same connection', async () => {
  const { connectMongo } = await freshMongooseModule(REAL_URI);
  const conn1 = await connectMongo();
  const conn2 = await connectMongo();
  assert.strictEqual(conn1, conn2, 'a second call must reuse the cached connection, not open a new one');
  await conn1.disconnect();
});

test('concurrent calls before the first resolves share the same in-flight promise', async () => {
  const { connectMongo } = await freshMongooseModule(REAL_URI);
  const callA = connectMongo();
  const callB = connectMongo();
  // Both calls were issued synchronously before either could have resolved - if the module
  // created a second connection instead of reusing the first pending one, this identity check
  // would fail (they'd still both eventually succeed, but as two different connections).
  const [connA, connB] = await Promise.all([callA, callB]);
  assert.strictEqual(connA, connB, 'concurrent calls must resolve to the same connection object');
  await connA.disconnect();
});

test('a rejected connection attempt clears the cached promise', async () => {
  const mod = await freshMongooseModule(UNREACHABLE_URI);
  await assert.rejects(() => mod.connectMongo());
  const cache = (globalThis as unknown as { __mongooseCache?: { promise: unknown } }).__mongooseCache;
  assert.equal(cache?.promise, null, 'the cache must be cleared back to null after a rejection');
});

test('the next call after a rejection creates a genuinely fresh attempt (not the stale rejected one)', async () => {
  const mod = await freshMongooseModule(UNREACHABLE_URI);
  const cacheRef = () => (globalThis as unknown as { __mongooseCache?: { promise: Promise<unknown> | null } }).__mongooseCache;

  const first = mod.connectMongo();
  const firstPromiseRef = cacheRef()?.promise;
  await assert.rejects(() => first);
  assert.equal(cacheRef()?.promise, null, 'cleared after first rejection');

  const second = mod.connectMongo();
  const secondPromiseRef = cacheRef()?.promise;
  assert.notStrictEqual(
    secondPromiseRef,
    firstPromiseRef,
    'the second attempt must be a genuinely new promise object, not the first (already-dead) one'
  );
  await assert.rejects(() => second, 'the fresh attempt still fails (same bad URI), proving it was real work, not a fluke');
  assert.equal(cacheRef()?.promise, null, 'cleared again after the second rejection too - recovery keeps working repeatedly');
});

test('identity-safe cleanup: a rejection never clears a newer promise installed after it', async () => {
  const mod = await freshMongooseModule(UNREACHABLE_URI);
  type Cache = { conn: unknown; promise: unknown };
  const g = globalThis as unknown as { __mongooseCache?: Cache };

  const stale = mod.connectMongo(); // will reject against the unreachable host
  // Simulate a concurrent process having already installed a newer attempt by the time the
  // stale one's rejection is observed - its cleanup must check identity before clearing.
  const sentinel = {};
  g.__mongooseCache!.promise = sentinel;

  await assert.rejects(() => stale);
  assert.strictEqual(
    g.__mongooseCache!.promise,
    sentinel,
    "the stale rejection's cleanup must not clobber a newer promise it doesn't own"
  );
});
