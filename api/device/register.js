import { createHandler } from '../_middleware/handler.js';
import { rateLimit } from '../_middleware/rateLimit.js';
import { success, ApiError } from '../_utils/response.js';
import { getSupabase } from '../_utils/supabase.js';
import logger from '../_utils/logger.js';
import {
  validateDeviceId,
  optionalUuid,
  optionalFcmToken,
  optionalString,
} from '../_utils/validation.js';

/**
 * Android calls this on every launch. The device_id is unique, so the row is
 * created once and updated afterwards - never duplicated.
 */
export default createHandler('POST', async (req, res) => {
  rateLimit(req, { scope: 'device-register', max: 60 });

  const body = req.jsonBody;
  const deviceId = validateDeviceId(body.device_id);
  const userId = optionalUuid(body.user_id, 'user_id');
  const fcmToken = optionalFcmToken(body.fcm_token);
  const appVersion = optionalString(body.app_version, 'app_version', 32);
  const androidVersion = optionalString(body.android_version, 'android_version', 32);
  const licenseKey = optionalString(body.license_key, 'license_key', 128);

  const supabase = getSupabase();

  const row = {
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
  return success(res, { device: data }, 'Device registered.');
});
