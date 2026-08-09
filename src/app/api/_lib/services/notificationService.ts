import { ApiError } from '../utils/response';
import logger from '../utils/logger';
import { sendToTokens } from '../utils/fcm';
import { connectMongo } from '@/lib/db/mongoose';
import { MyraDevice, MyraProfile, Notification, NotificationDelivery } from '@/lib/db/models';

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

/** True for a MyraProfile with a currently-active paid plan (not free, not cancelled/expired,
 *  and not past subscriptionExpiry). Mirrors the freemium check the Android app itself uses. */
function hasActivePaidPlan(profile: any): boolean {
  if (!profile.subscriptionType || profile.subscriptionType === 'free') return false;
  if (profile.subscriptionStatus === 'cancelled' || profile.subscriptionStatus === 'expired') return false;
  if (profile.subscriptionExpiry && new Date(profile.subscriptionExpiry).getTime() <= Date.now()) return false;
  return true;
}

/** deviceIds of MyraDevices (with a push token) belonging to users whose MyraProfile passes
 *  `filter` - the MYRA-native equivalent of a plan-based device audience. */
async function myraDeviceIdsForProfileFilter(filter: (profile: any) => boolean): Promise<Set<string>> {
  await connectMongo();
  const profiles = await MyraProfile.find({})
    .select('userId subscriptionType subscriptionStatus subscriptionExpiry')
    .lean();
  const matchingUserIds = profiles.filter(filter).map((p: any) => p.userId.toString());
  if (!matchingUserIds.length) return new Set();

  const devices = await MyraDevice.find({
    userId: { $in: matchingUserIds },
    pushToken: { $ne: null },
  })
    .select('deviceId')
    .lean();
  return new Set(devices.map((d: any) => d.deviceId));
}

/** Resolves the audience into a list of { device_id, fcm_token } targets, sourced from
 *  MyraDevice - the collection the MYRA Android app actually registers its push token into
 *  (see myraService.ts's upsertMyraDevice). The legacy `Device`/`License` collections track
 *  other codeninjavik marketplace products activated by license key, not MYRA app installs -
 *  using them here meant this notification system could never actually reach a MYRA user. */
export async function resolveTargets({ target, targetValue }: { target: string; targetValue?: string | null }) {
  await connectMongo();

  const toTargets = (docs: any[]) =>
    docs.map((d) => ({ device_id: d.deviceId, fcm_token: d.pushToken, user_id: d.userId?.toString() ?? null }));

  if (target === 'device') {
    const docs = await MyraDevice.find({ deviceId: targetValue, pushToken: { $ne: null } }).lean();
    if (!docs.length) {
      throw ApiError.notFound('No registered device with a push token.', 'DEVICE_NOT_FOUND');
    }
    return toTargets(docs);
  }

  if (target === 'user') {
    const docs = await MyraDevice.find({ userId: targetValue, pushToken: { $ne: null } }).lean();
    if (!docs.length) {
      throw ApiError.notFound('No devices found for this user.', 'USER_DEVICES_NOT_FOUND');
    }
    return toTargets(docs);
  }

  const allDevices = await MyraDevice.find({ pushToken: { $ne: null } }).lean();
  const devices = toTargets(allDevices);

  if (target === 'all') return devices;

  if (target === 'premium') {
    const ids = await myraDeviceIdsForProfileFilter(hasActivePaidPlan);
    return devices.filter((d) => ids.has(d.device_id));
  }

  // "Lifetime" is MYRA_PLANS' `membership` plan (₹999, unlimited, no expiry).
  if (target === 'lifetime') {
    const ids = await myraDeviceIdsForProfileFilter(
      (p) => hasActivePaidPlan(p) && p.subscriptionType === 'membership'
    );
    return devices.filter((d) => ids.has(d.device_id));
  }

  if (target === 'free') {
    const ids = await myraDeviceIdsForProfileFilter(hasActivePaidPlan);
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
    // "No devices matched" on its own is unactionable — the usual cause is that devices are
    // registered but none has a push token yet (an app build older than the one that registers
    // its FCM token against MyraDevice, or users who never reopened the app after logging in).
    // Say which of the two it is.
    const [totalDevices, withToken] = await Promise.all([
      MyraDevice.countDocuments({}),
      MyraDevice.countDocuments({ pushToken: { $ne: null } }),
    ]);
    const message = withToken
      ? `No devices matched this audience (${withToken} of ${totalDevices} registered devices have a push token).`
      : `None of the ${totalDevices} registered devices has a push token yet, so there is nobody to send to. ` +
        `Devices register their token on app start once they are signed in.`;

    await Notification.findByIdAndUpdate(record._id, { status: 'failed', errorMessage: message });
    throw ApiError.notFound(message, 'NO_TARGETS');
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
