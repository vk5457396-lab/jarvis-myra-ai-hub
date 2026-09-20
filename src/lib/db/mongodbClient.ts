import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
  var __mongoClientPromise: Promise<MongoClient> | null | undefined;
}

/**
 * Native driver client, used only by the NextAuth MongoDB adapter (it needs
 * a raw MongoClient, not a Mongoose connection). Cached the same way as
 * mongoose.ts so both share the connection pool pattern across invocations.
 */
function createClientPromise(): Promise<MongoClient> {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set.');
  }
  return new MongoClient(MONGODB_URI).connect();
}

/**
 * Exported as a FUNCTION, not a static promise - @auth/mongodb-adapter's MongoDBAdapter()
 * explicitly supports `() => Promise<MongoClient>` for exactly this reason (see its own
 * index.d.ts). A plain top-level `const clientPromise = createClientPromise()` is evaluated once
 * per warm serverless instance and can never be replaced afterwards, so a single transient
 * connection failure would leave the adapter permanently stuck re-awaiting the same rejected
 * promise for that instance's entire remaining lifetime. Calling this function fresh each time
 * lets a failed attempt be retried on the next request instead.
 */
export function getMongoClientPromise(): Promise<MongoClient> {
  if (!globalThis.__mongoClientPromise) {
    const promise = createClientPromise();
    globalThis.__mongoClientPromise = promise;
    // Only clear the cache if it still points at THIS promise - a concurrent request may
    // already have installed a newer one (e.g. after an earlier reset) by the time this
    // rejection is observed, and that newer attempt must not be wiped out.
    promise.catch(() => {
      if (globalThis.__mongoClientPromise === promise) {
        globalThis.__mongoClientPromise = null;
      }
    });
  }
  return globalThis.__mongoClientPromise;
}
