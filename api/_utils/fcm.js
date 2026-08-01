import admin from 'firebase-admin';
import logger from './logger.js';
import { ApiError } from './response.js';
import { getSupabase } from './supabase.js';

let app = null;

function serviceAccount() {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!raw) return null;

  const text = raw.trim().startsWith('{')
    ? raw
    : Buffer.from(raw, 'base64').toString('utf8');

  try {
    const parsed = JSON.parse(text);
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return parsed;
  } catch {
    return null;
  }
}

function getApp() {
  if (app) return app;
  if (admin.apps.length) {
    app = admin.apps[0];
    return app;
  }

  const credentials = serviceAccount();
  if (!credentials) {
    throw ApiError.internal(
      'Push notifications are not configured.',
      'FCM_NOT_CONFIGURED'
    );
  }

  app = admin.initializeApp({ credential: admin.credential.cert(credentials) });
  return app;
}

const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
  'messaging/invalid-argument',
]);

const RETRYABLE_CODES = new Set([
  'messaging/internal-error',
  'messaging/server-unavailable',
  'messaging/unavailable',
  'messaging/quota-exceeded',
]);

function buildMessage(payload) {
  const data = {};
  if (payload.deep_link) data.deep_link = payload.deep_link;
  if (payload.action) data.action = payload.action;
  if (payload.custom_url) data.custom_url = payload.custom_url;
  if (payload.notification_type) data.notification_type = payload.notification_type;
  if (payload.notification_id) data.notification_id = payload.notification_id;

  return {
    notification: {
      title: payload.title,
      body: payload.body,
      ...(payload.image_url ? { imageUrl: payload.image_url } : {}),
    },
    data,
    android: {
      priority: payload.priority === 'normal' ? 'normal' : 'high',
      notification: {
        ...(payload.image_url ? { imageUrl: payload.image_url } : {}),
        channelId: 'myra_default',
sound: 'default',
      },
    },
  };
}

async function removeInvalidTokens(tokens) {
  if (!tokens.length) return;
  const supabase = getSupabase();
  await supabase.from('devices').update({ fcm_token: null }).in('fcm_token', tokens);
  logger.warn('Removed invalid FCM tokens', { count: tokens.length });
}

/**
 * Sends one notification to a list of device tokens.
 * Invalid tokens are cleaned up, temporary failures are retried once.
 */
export async function sendToTokens(targets, payload) {
  const messaging = admin.messaging(getApp());
  const base = buildMessage(payload);

  const results = [];
  const invalidTokens = [];
  const retryTargets = [];

  const deliver = async (batch) => {
    const response = await messaging.sendEach(
      batch.map((t) => ({ ...base, token: t.fcm_token }))
    );
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
