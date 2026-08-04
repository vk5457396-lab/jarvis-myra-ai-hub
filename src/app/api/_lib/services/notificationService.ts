import { ApiError } from '../utils/response';
import logger from '../utils/logger';
import { sendToTokens } from '../utils/fcm';
import { normalizePlan } from '../utils/plan';
import { connectMongo } from '@/lib/db/mongoose';
import { License, Device, Notification, NotificationDelivery } from '@/lib/db/models';

export function toLegacyNotification(doc: any) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    title: doc.title,
    body: doc.body,
    image_url: doc.imageUrl ?? null,
    deep_link: doc.deepLink ?? null,
    action: doc.action ?? null,
    custom_url: doc.customUrl ?? null,
    notification_type: doc.notificationType,
    priority: doc.priority,
    target: doc.target,
    target_value: doc.targetValue ?? null,
    scheduled_at: doc.scheduledAt ?? null,
    status: doc.status,
    success_count: doc.successCount ?? 0,
    failure_count: doc.failureCount ?? 0,
    error_message: doc.errorMessage ?? null,
    created_by: doc.createdBy ?? null,
    created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updated_at: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

/** Devices whose bound license is currently active (not expired / disabled). */
async function activeLicenseDeviceIds(planFilter: string | null) {
  await connectMongo();
  const licenses = await License.find({ deviceId: { $ne: null } })
    .select('deviceId plan status expiresAt')
    .lean();

  const now = Date.now();
  return licenses
    .filter((l: any) => l.status !== 'disabled')
    .filter((l: any) => !l.expiresAt || new Date(l.expiresAt).getTime() > now)
    .filter((l: any) => (planFilter ? normalizePlan(l.plan) === planFilter : true))
    .map((l: any) => l.deviceId);
}

/** Resolves the audience into a list of { device_id, fcm_token } targets. */
export async function resolveTargets({ target, targetValue }: { target: string; targetValue?: string | null }) {
  await connectMongo();

  const toTargets = (docs: any[]) =>
    docs.map((d) => ({ device_id: d.deviceId, fcm_token: d.fcmToken, user_id: d.userId }));

  if (target === 'device') {
    const docs = await Device.find({ deviceId: targetValue, fcmToken: { $ne: null } }).lean();
    if (!docs.length) {
      throw ApiError.notFound('No registered device with a push token.', 'DEVICE_NOT_FOUND');
    }
    return toTargets(docs);
  }

  if (target === 'user') {
    const docs = await Device.find({ userId: targetValue, fcmToken: { $ne: null } }).lean();
    if (!docs.length) {
      throw ApiError.notFound('No devices found for this user.', 'USER_DEVICES_NOT_FOUND');
    }
    return toTargets(docs);
  }

  const allDevices = await Device.find({ fcmToken: { $ne: null } }).lean();
  const devices = toTargets(allDevices);

  if (target === 'all') return devices;

  if (target === 'premium') {
    const ids = new Set(await activeLicenseDeviceIds(null));
    return devices.filter((d) => ids.has(d.device_id));
  }

  if (target === 'lifetime') {
    const ids = new Set(await activeLicenseDeviceIds('lifetime'));
    return devices.filter((d) => ids.has(d.device_id));
  }

  if (target === 'free') {
    const ids = new Set(await activeLicenseDeviceIds(null));
    return devices.filter((d) => !ids.has(d.device_id));
  }

  return devices;
}

/**
 * Creates the history row, delivers via FCM and records per-device results.
 * Scheduled notifications are stored as `scheduled` and not delivered now.
 */
export async function dispatchNotification(payload: any) {
  await connectMongo();

  const record = await Notification.create({
    title: payload.title,
    body: payload.body,
    imageUrl: payload.image_url,
    deepLink: payload.deep_link,
    action: payload.action,
    customUrl: payload.custom_url,
    notificationType: payload.notification_type,
    priority: payload.priority,
    target: payload.target,
    targetValue: payload.target_value,
    scheduledAt: payload.scheduled_at,
    status: payload.scheduled_at ? 'scheduled' : 'sending',
    createdBy: payload.created_by || null,
  });

  if (payload.scheduled_at) {
    logger.info('Notification scheduled', { notification_id: record._id.toString() });
    return { notification: toLegacyNotification(record), success_count: 0, failure_count: 0, scheduled: true };
  }

  let targets;
  try {
    targets = await resolveTargets({ target: payload.target, targetValue: payload.target_value });
  } catch (error: any) {
    await Notification.findByIdAndUpdate(record._id, { status: 'failed', errorMessage: error.message });
    throw error;
  }

  if (!targets.length) {
    await Notification.findByIdAndUpdate(record._id, {
      status: 'failed',
      errorMessage: 'No devices matched this audience.',
    });
    throw ApiError.notFound('No devices matched this audience.', 'NO_TARGETS');
  }

  let outcome;
  try {
    outcome = await sendToTokens(targets, { ...payload, notification_id: record._id.toString() });
  } catch (error: any) {
    await Notification.findByIdAndUpdate(record._id, { status: 'failed', errorMessage: error.message });
    throw error instanceof ApiError ? error : ApiError.internal('Failed to deliver notification.', 'FCM_SEND_FAILED');
  }

  if (outcome.results.length) {
    await NotificationDelivery.insertMany(
      outcome.results.map((r: any) => ({
        notificationId: record._id,
        deviceId: r.device_id,
        fcmToken: r.fcm_token,
        success: r.success,
        errorCode: r.error_code,
      }))
    );
  }

  const status = outcome.successCount === 0 ? 'failed' : outcome.failureCount ? 'partial' : 'sent';

  const updated = await Notification.findByIdAndUpdate(
    record._id,
    { status, successCount: outcome.successCount, failureCount: outcome.failureCount },
    { new: true }
  );

  logger.info('Notification sent', {
    notification_id: record._id.toString(),
    target: payload.target,
    success: outcome.successCount,
    failure: outcome.failureCount,
  });

  return {
    notification: toLegacyNotification(updated || record),
    success_count: outcome.successCount,
    failure_count: outcome.failureCount,
    scheduled: false,
  };
}
