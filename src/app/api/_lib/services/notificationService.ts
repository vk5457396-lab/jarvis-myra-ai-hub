import { getSupabase } from '../utils/supabase';
import { ApiError } from '../utils/response';
import logger from '../utils/logger';
import { sendToTokens } from '../utils/fcm';
import { normalizePlan } from '../utils/plan';

/** Devices whose bound license is currently active (not expired / disabled). */
async function activeLicenseDeviceIds(planFilter: string | null) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('licenses')
    .select('device_id, plan, status, expires_at')
    .not('device_id', 'is', null);
  if (error) throw ApiError.internal('Database error.', 'DB_ERROR');

  const now = Date.now();
  return (data || [])
    .filter((l: any) => l.status !== 'disabled')
    .filter((l: any) => !l.expires_at || new Date(l.expires_at).getTime() > now)
    .filter((l: any) => (planFilter ? normalizePlan(l.plan) === planFilter : true))
    .map((l: any) => l.device_id);
}

/** Resolves the audience into a list of { device_id, fcm_token } targets. */
export async function resolveTargets({ target, targetValue }: { target: string; targetValue?: string | null }) {
  const supabase = getSupabase();

  const baseQuery = () =>
    supabase.from('devices').select('device_id, fcm_token, user_id').not('fcm_token', 'is', null);

  if (target === 'device') {
    const { data, error } = await baseQuery().eq('device_id', targetValue);
    if (error) throw ApiError.internal('Database error.', 'DB_ERROR');
    if (!data || !data.length) {
      throw ApiError.notFound('No registered device with a push token.', 'DEVICE_NOT_FOUND');
    }
    return data;
  }

  if (target === 'user') {
    const { data, error } = await baseQuery().eq('user_id', targetValue);
    if (error) throw ApiError.internal('Database error.', 'DB_ERROR');
    if (!data || !data.length) {
      throw ApiError.notFound('No devices found for this user.', 'USER_DEVICES_NOT_FOUND');
    }
    return data;
  }

  const { data: allDevices, error } = await baseQuery();
  if (error) throw ApiError.internal('Database error.', 'DB_ERROR');
  const devices = allDevices || [];

  if (target === 'all') return devices;

  if (target === 'premium') {
    const ids = new Set(await activeLicenseDeviceIds(null));
    return devices.filter((d: any) => ids.has(d.device_id));
  }

  if (target === 'lifetime') {
    const ids = new Set(await activeLicenseDeviceIds('lifetime'));
    return devices.filter((d: any) => ids.has(d.device_id));
  }

  if (target === 'free') {
    const ids = new Set(await activeLicenseDeviceIds(null));
    return devices.filter((d: any) => !ids.has(d.device_id));
  }

  return devices;
}

/**
 * Creates the history row, delivers via FCM and records per-device results.
 * Scheduled notifications are stored as `scheduled` and not delivered now.
 */
export async function dispatchNotification(payload: any) {
  const supabase = getSupabase();

  const { data: record, error: insertError } = await supabase
    .from('notifications')
    .insert({
      title: payload.title,
      body: payload.body,
      image_url: payload.image_url,
      deep_link: payload.deep_link,
      action: payload.action,
      custom_url: payload.custom_url,
      notification_type: payload.notification_type,
      priority: payload.priority,
      target: payload.target,
      target_value: payload.target_value,
      scheduled_at: payload.scheduled_at,
      status: payload.scheduled_at ? 'scheduled' : 'sending',
      created_by: payload.created_by || null,
    })
    .select('*')
    .single();

  if (insertError) throw ApiError.internal('Database error.', 'DB_ERROR');

  if (payload.scheduled_at) {
    logger.info('Notification scheduled', { notification_id: record.id });
    return { notification: record, success_count: 0, failure_count: 0, scheduled: true };
  }

  let targets;
  try {
    targets = await resolveTargets({ target: payload.target, targetValue: payload.target_value });
  } catch (error: any) {
    await supabase.from('notifications').update({ status: 'failed', error_message: error.message }).eq('id', record.id);
    throw error;
  }

  if (!targets.length) {
    await supabase
      .from('notifications')
      .update({ status: 'failed', error_message: 'No devices matched this audience.' })
      .eq('id', record.id);
    throw ApiError.notFound('No devices matched this audience.', 'NO_TARGETS');
  }

  let outcome;
  try {
    outcome = await sendToTokens(targets, { ...payload, notification_id: record.id });
  } catch (error: any) {
    await supabase.from('notifications').update({ status: 'failed', error_message: error.message }).eq('id', record.id);
    throw error instanceof ApiError ? error : ApiError.internal('Failed to deliver notification.', 'FCM_SEND_FAILED');
  }

  if (outcome.results.length) {
    await supabase.from('notification_deliveries').insert(
      outcome.results.map((r: any) => ({
        notification_id: record.id,
        device_id: r.device_id,
        fcm_token: r.fcm_token,
        success: r.success,
        error_code: r.error_code,
      }))
    );
  }

  const status = outcome.successCount === 0 ? 'failed' : outcome.failureCount ? 'partial' : 'sent';

  const { data: updated } = await supabase
    .from('notifications')
    .update({
      status,
      success_count: outcome.successCount,
      failure_count: outcome.failureCount,
    })
    .eq('id', record.id)
    .select('*')
    .maybeSingle();

  logger.info('Notification sent', {
    notification_id: record.id,
    target: payload.target,
    success: outcome.successCount,
    failure: outcome.failureCount,
  });

  return {
    notification: updated || record,
    success_count: outcome.successCount,
    failure_count: outcome.failureCount,
    scheduled: false,
  };
}
