import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
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

const clientPromise = globalThis.__mongoClientPromise ?? createClientPromise();
globalThis.__mongoClientPromise = clientPromise;

export default clientPromise;
