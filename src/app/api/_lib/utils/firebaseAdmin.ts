import { initializeApp, getApps, cert, type App, type ServiceAccount } from 'firebase-admin/app';
import { ApiError } from './response';

let app: App | null = null;

function serviceAccount(): ServiceAccount | null {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!raw) return null;

  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');

  try {
    const parsed = JSON.parse(text);
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return parsed;
  } catch {
    return null;
  }
}

/** Shared Admin SDK app singleton — used by FCM send and by Firestore custom-token minting. */
export function getFirebaseApp(): App {
  if (app) return app;
  const existing = getApps();
  if (existing.length) {
    app = existing[0]!;
    return app;
  }

  const credentials = serviceAccount();
  if (!credentials) {
    throw ApiError.internal('Firebase Admin is not configured.', 'FIREBASE_NOT_CONFIGURED');
  }

  app = initializeApp({ credential: cert(credentials) });
  return app;
}
