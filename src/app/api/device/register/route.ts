export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success, ApiError } from '../../_lib/utils/response';
import logger from '../../_lib/utils/logger';
import { validateDeviceId, optionalString, optionalFcmToken } from '../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { Device } from '@/lib/db/models';

export const OPTIONS = handleOptions(['POST']);

/**
 * Android calls this on every launch. The device_id is unique, so the row is
 * created once and updated afterwards - never duplicated.
 */
export const POST = withApi(
  async (req) => {
    const body = await req.json();
    const deviceId = validateDeviceId(body.device_id);
    const userId = optionalString(body.user_id, 'user_id', 128);
    const fcmToken = optionalFcmToken(body.fcm_token);
    const appVersion = optionalString(body.app_version, 'app_version', 32);
    const androidVersion = optionalString(body.android_version, 'android_version', 32);
    const licenseKey = optionalString(body.license_key, 'license_key', 128);

    const set: Record<string, any> = { lastSeenAt: new Date() };
    if (userId !== null) set.userId = userId;
    if (fcmToken !== null) set.fcmToken = fcmToken;
    if (appVersion !== null) set.appVersion = appVersion;
    if (androidVersion !== null) set.androidVersion = androidVersion;
    if (licenseKey !== null) set.licenseKey = licenseKey.toUpperCase();

    await connectMongo();

    let doc;
    try {
      doc = await Device.findOneAndUpdate(
        { deviceId },
        { $set: set, $setOnInsert: { deviceId } },
        { new: true, upsert: true }
      );
    } catch (error: any) {
      logger.error('Device registration failed', { detail: error.message });
      throw ApiError.internal('Database error.', 'DB_ERROR');
    }

    logger.info('Device registered', { device_id: deviceId, app_version: appVersion });
    return success(
      {
        device: {
          device_id: doc.deviceId,
          user_id: doc.userId,
          app_version: doc.appVersion,
          android_version: doc.androidVersion,
          license_key: doc.licenseKey,
          last_seen_at: doc.lastSeenAt,
        },
      },
      'Device registered.'
    );
  },
  { rateLimit: { scope: 'device-register', max: 60 } }
);
