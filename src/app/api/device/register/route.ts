export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success, ApiError } from '../../_lib/utils/response';
import { getSupabase } from '../../_lib/utils/supabase';
import logger from '../../_lib/utils/logger';
import { validateDeviceId, optionalUuid, optionalFcmToken, optionalString } from '../../_lib/utils/validation';

export const OPTIONS = handleOptions(['POST']);

/**
 * Android calls this on every launch. The device_id is unique, so the row is
 * created once and updated afterwards - never duplicated.
 */
export const POST = withApi(
  async (req) => {
    const body = await req.json();
    const deviceId = validateDeviceId(body.device_id);
    const userId = optionalUuid(body.user_id, 'user_id');
    const fcmToken = optionalFcmToken(body.fcm_token);
    const appVersion = optionalString(body.app_version, 'app_version', 32);
    const androidVersion = optionalString(body.android_version, 'android_version', 32);
    const licenseKey = optionalString(body.license_key, 'license_key', 128);

    const supabase = getSupabase();

    const row: Record<string, any> = {
      device_id: deviceId,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (userId !== null) row.user_id = userId;
    if (fcmToken !== null) row.fcm_token = fcmToken;
    if (appVersion !== null) row.app_version = appVersion;
    if (androidVersion !== null) row.android_version = androidVersion;
    if (licenseKey !== null) row.license_key = licenseKey.toUpperCase();

    const { data, error } = await supabase
      .from('devices')
      .upsert(row, { onConflict: 'device_id' })
      .select('device_id, user_id, app_version, android_version, license_key, last_seen_at')
      .single();

    if (error) {
      logger.error('Device registration failed', { detail: error.message });
      throw ApiError.internal('Database error.', 'DB_ERROR');
    }

    logger.info('Device registered', { device_id: deviceId, app_version: appVersion });
    return success({ device: data }, 'Device registered.');
  },
  { rateLimit: { scope: 'device-register', max: 60 } }
);
