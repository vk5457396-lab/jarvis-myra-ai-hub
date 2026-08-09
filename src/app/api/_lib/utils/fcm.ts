import { initializeApp, getApps, cert, type App, type ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import logger from './logger';
import { ApiError } from './response';
import { connectMongo } from '@/lib/db/mongoose';
import { MyraDevice } from '@/lib/db/models';

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

function getApp(): App {
  if (app) return app;
  const existing = getApps();
  if (existing.length) {
    app = existing[0]!;
    return app;
  }

  const credentials = serviceAccount();
  if (!credentials) {
    throw ApiError.internal('Push notifications are not configured.', 'FCM_NOT_CONFIGURED');
  }

  app = initializeApp({ credential: cert(credentials) });
  return app;
}

const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
  'messaging/invalid-argument',
  // The token was minted by an Android build pointed at a different Firebase
  // project than this Admin SDK credential (e.g. a stale APK still holding a
  // token from before the app's google-services.json had a com.myra.voice
  // client entry). It will never succeed - clear it so the device re-registers
  // a fresh token on next app open instead of failing forever, silently.
  'messaging/mismatched-credential',
  'messaging/sender-id-mismatch',
]);

const RETRYABLE_CODES = new Set([
  'messaging/internal-error',
  'messaging/server-unavailable',
  'messaging/unavailable',
  'messaging/quota-exceeded',
]);

/**
 * Data-only on purpose. A message carrying a `notification` block is drawn by the Android
 * system tray whenever the app is backgrounded, and MyraFirebaseMessagingService.onMessageReceived
 * is then never called — so announcements never reached the in-app Notification Center, and the
 * tray used whatever channel id we named here (`myra_default`, which the app does not create).
 * Data-only hands every message to the app, which builds the notification on its own
 * `myra_push_notifications` channel and writes it to the local history.
 *
 * Keys must match what MyraFirebaseMessagingService reads. All values must be strings.
 */
function buildMessage(payload: any) {
  const data: Record<string, string> = {
    title: String(payload.title ?? ''),
    message: String(payload.body ?? ''),
  };
  if (payload.image_url) data.image_url = payload.image_url;
  if (payload.deep_link) data.deep_link = payload.deep_link;
  if (payload.action) data.action = payload.action;
  if (payload.custom_url) data.custom_url = payload.custom_url;
  if (payload.notification_type) data.notification_type = payload.notification_type;
  if (payload.notification_id) data.notification_id = payload.notification_id;

  return {
    data,
    android: {
      priority: payload.priority === 'normal' ? ('normal' as const) : ('high' as const),
    },
  };
}

async function removeInvalidTokens(tokens: string[]) {
  if (!tokens.length) return;
  await connectMongo();
  await MyraDevice.updateMany({ pushToken: { $in: tokens } }, { $set: { pushToken: null } });
  logger.warn('Removed invalid FCM tokens', { count: tokens.length });
}

/**
 * Sends one notification to a list of device tokens.
 * Invalid tokens are cleaned up, temporary failures are retried once.
 */
export async function sendToTokens(targets: any[], payload: any) {
  const messaging = getMessaging(getApp());
  const base = buildMessage(payload);

  const results: any[] = [];
  const invalidTokens: string[] = [];
  const retryTargets: any[] = [];

  const deliver = async (batch: any[]) => {
    const response = await messaging.sendEach(batch.map((t) => ({ ...base, token: t.fcm_token })));
    response.responses.forEach((r, i) => {
      const target = batch[i];
      if (r.success) {
        results.push({ ...target, success: true, error_code: null });
        return;
      }
      const code = r.error?.code || 'messaging/unknown-error';
      if (INVALID_TOKEN_CODES.has(code)) invalidTokens.push(target.fcm_token);
      if (RETRYABLE_CODES.has(code)) retryTargets.push(target);
      else results.push({ ...target, success: false, error_code: code });
    });
  };

  // FCM allows up to 500 messages per sendEach call.
  for (let i = 0; i < targets.length; i += 500) {
    await deliver(targets.slice(i, i + 500));
  }

  if (retryTargets.length) {
    const pending = retryTargets.splice(0, retryTargets.length);
    await new Promise((r) => setTimeout(r, 750));
    for (let i = 0; i < pending.length; i += 500) {
      await deliver(pending.slice(i, i + 500));
    }
    // Anything still retryable after one retry is recorded as a failure.
    for (const target of retryTargets) {
      results.push({ ...target, success: false, error_code: 'messaging/unavailable' });
    }
  }

  if (invalidTokens.length) await removeInvalidTokens(invalidTokens);

  return {
    results,
    successCount: results.filter((r) => r.success).length,
    failureCount: results.filter((r) => !r.success).length,
  };
}
