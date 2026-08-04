import { getSupabase } from '../utils/supabase';
import { ApiError } from '../utils/response';
import logger from '../utils/logger';
import { signActivationToken, verifyActivationToken } from '../utils/jwt';
import {
  STATUS,
  computeExpiry,
  isExpired,
  normalizePlan,
  planDurationDays,
  planLabel,
  publicLicense,
} from '../utils/plan';

const COLUMNS =
  'id, license_key, plan, duration, status, device_id, created_at, activated_at, expires_at, updated_at, activation_token';

export async function findByKey(licenseKey: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('licenses')
    .select(COLUMNS)
    .eq('license_key', licenseKey)
    .maybeSingle();
  if (error) throw ApiError.internal('Database error.', 'DB_ERROR');
  return data || null;
}

export async function findById(id: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('licenses').select(COLUMNS).eq('id', id).maybeSingle();
  if (error) throw ApiError.internal('Database error.', 'DB_ERROR');
  return data || null;
}

export async function update(id: string, patch: Record<string, any>) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('licenses')
    .update(patch)
    .eq('id', id)
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw ApiError.internal('Database error.', 'DB_ERROR');
  return data || null;
}

/** Atomically binds a free license to a device (wins the race or returns null). */
async function claimForDevice(id: string, patch: Record<string, any>) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('licenses')
    .update(patch)
    .eq('id', id)
    .is('device_id', null)
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw ApiError.internal('Database error.', 'DB_ERROR');
  return data || null;
}

async function syncExpiry(license: any) {
  if (license.status !== STATUS.EXPIRED && isExpired(license.expires_at)) {
    const updated = await update(license.id, { status: STATUS.EXPIRED, activation_token: null });
    return updated || { ...license, status: STATUS.EXPIRED };
  }
  return license;
}

/** Verify / activate a license for one device. */
export async function verifyLicense({
  licenseKey,
  deviceId,
  appVersion,
  androidVersion,
}: {
  licenseKey: string;
  deviceId: string;
  appVersion?: string | null;
  androidVersion?: string | null;
}) {
  const found = await findByKey(licenseKey);
  if (!found) throw ApiError.notFound('Invalid license.', 'LICENSE_NOT_FOUND');

  const license = await syncExpiry(found);

  if (license.status === STATUS.DISABLED) {
    throw ApiError.forbidden('License disabled.', 'LICENSE_DISABLED');
  }
  if (license.device_id && license.device_id !== deviceId) {
    throw ApiError.conflict('License already activated on another device.', 'DEVICE_MISMATCH');
  }

  if (license.device_id === deviceId) {
    if (isExpired(license.expires_at)) {
      throw ApiError.forbidden('License expired.', 'LICENSE_EXPIRED');
    }
    const token = signActivationToken(license, deviceId);
    await update(license.id, { activation_token: token });
    logger.info('License re-verified', { license_id: license.id, app_version: appVersion });
    return {
      plan: planLabel(license.plan),
      plan_id: normalizePlan(license.plan),
      expires_at: license.expires_at || null,
      activated_at: license.activated_at,
      activation_token: token,
      license: publicLicense(license),
    };
  }

  const activatedAt = new Date();
  const expiresAt = computeExpiry(license, activatedAt);
  const claimed = await claimForDevice(license.id, {
    device_id: deviceId,
    activated_at: activatedAt.toISOString(),
    expires_at: expiresAt,
    status: STATUS.ACTIVATED,
  });

  if (!claimed) {
    throw ApiError.conflict('License already activated on another device.', 'DEVICE_MISMATCH');
  }

  const token = signActivationToken(claimed, deviceId);
  const withToken = (await update(claimed.id, { activation_token: token })) || claimed;

  logger.info('License activated', {
    license_id: withToken.id,
    plan: normalizePlan(withToken.plan),
    app_version: appVersion,
    android_version: androidVersion,
  });

  return {
    plan: planLabel(withToken.plan),
    plan_id: normalizePlan(withToken.plan),
    expires_at: withToken.expires_at || null,
    activated_at: withToken.activated_at,
    activation_token: token,
    license: publicLicense(withToken),
  };
}

/** Validates a device token and returns the latest license state. */
export async function checkLicense({ token, deviceId }: { token: string; deviceId?: string | null }) {
  const payload = verifyActivationToken(token);

  const license = await findById(payload.license_id);
  if (!license) throw ApiError.notFound('Invalid license.', 'LICENSE_NOT_FOUND');

  const synced = await syncExpiry(license);

  if (deviceId && payload.device_id !== deviceId) {
    throw ApiError.forbidden('Token does not belong to this device.', 'DEVICE_MISMATCH');
  }
  if (synced.device_id && payload.device_id !== synced.device_id) {
    throw ApiError.forbidden('License is bound to another device.', 'DEVICE_MISMATCH');
  }
  if (synced.status === STATUS.DISABLED) {
    throw ApiError.forbidden('License disabled.', 'LICENSE_DISABLED');
  }
  if (isExpired(synced.expires_at)) {
    throw ApiError.forbidden('License expired.', 'LICENSE_EXPIRED');
  }

  return { valid: true, ...publicLicense(synced) };
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomKey(prefix: string, length: number): string {
  const bytes = new Uint32Array(Math.max(8, length));
  globalThis.crypto.getRandomValues(bytes);
  let raw = '';
  for (let i = 0; i < bytes.length; i += 1) raw += ALPHABET[bytes[i] % ALPHABET.length];
  const groups = raw.match(/.{1,4}/g) || [raw];
  return `${prefix}-${groups.join('-')}`;
}

/** Generates and stores new license keys in the database. */
export async function generateLicenses({
  plan,
  quantity,
  prefix,
  length,
}: {
  plan: string;
  quantity: number;
  prefix?: string | null;
  length?: number | null;
}) {
  const supabase = getSupabase();
  const normalized = normalizePlan(plan);
  const duration = planDurationDays(normalized);

  const { data: settings } = await supabase
    .from('license_settings')
    .select('prefix, random_length')
    .maybeSingle();

  const usedPrefix = prefix || settings?.prefix || 'MYRA';
  const usedLength = length || settings?.random_length || 16;

  const { data: existing, error: existingError } = await supabase.from('licenses').select('license_key');
  if (existingError) throw ApiError.internal('Database error.', 'DB_ERROR');

  const taken = new Set((existing || []).map((r: any) => r.license_key));
  const keys: string[] = [];
  let guard = 0;
  while (keys.length < quantity && guard < quantity * 50) {
    guard += 1;
    const key = randomKey(usedPrefix, usedLength);
    if (taken.has(key)) continue;
    taken.add(key);
    keys.push(key);
  }

  if (keys.length < quantity) {
    throw ApiError.internal('Could not generate unique keys.', 'KEY_GENERATION_FAILED');
  }

  const rows = keys.map((license_key) => ({
    license_key,
    plan: normalized,
    duration,
    status: STATUS.AVAILABLE,
  }));

  const { data: inserted, error } = await supabase
    .from('licenses')
    .insert(rows)
    .select('license_key, plan, duration, status, created_at');
  if (error) throw ApiError.internal('Database error.', 'DB_ERROR');

  logger.info('Licenses generated', { count: keys.length, plan: normalized });

  return {
    plan: planLabel(normalized),
    plan_id: normalized,
    count: inserted!.length,
    licenses: inserted,
    keys,
  };
}

/** Admin: unbind the device, keep the license usable. */
export async function resetDevice(licenseKey: string) {
  const license = await findByKey(licenseKey);
  if (!license) throw ApiError.notFound('Invalid license.', 'LICENSE_NOT_FOUND');

  const updated = await update(license.id, {
    device_id: null,
    activation_token: null,
    activated_at: null,
    expires_at: null,
    status: license.status === STATUS.DISABLED ? STATUS.DISABLED : STATUS.AVAILABLE,
  });

  logger.info('License device reset', { license_id: license.id });
  return publicLicense(updated || license);
}

/** Admin: revoke a license immediately. */
export async function deactivateLicense(licenseKey: string) {
  const license = await findByKey(licenseKey);
  if (!license) throw ApiError.notFound('Invalid license.', 'LICENSE_NOT_FOUND');

  const updated = await update(license.id, { status: STATUS.DISABLED, activation_token: null });
  logger.info('License disabled', { license_id: license.id });
  return publicLicense(updated || license);
}

/** Admin: extend a license, optionally switching plan. */
export async function renewLicense(licenseKey: string, { days, plan }: { days?: number | null; plan?: string | null }) {
  const license = await findByKey(licenseKey);
  if (!license) throw ApiError.notFound('Invalid license.', 'LICENSE_NOT_FOUND');

  const nextPlan = plan ? normalizePlan(plan) : normalizePlan(license.plan);
  const patch: Record<string, any> = {
    plan: nextPlan,
    duration: planDurationDays(nextPlan),
    status: STATUS.ACTIVATED,
  };

  if (nextPlan === 'lifetime' && !days) {
    patch.expires_at = null;
  } else {
    const base =
      license.expires_at && !isExpired(license.expires_at) ? new Date(license.expires_at) : new Date();
    const effectiveDays = days || planDurationDays(nextPlan) || 30;
    patch.expires_at = new Date(base.getTime() + effectiveDays * 86400000).toISOString();
  }

  if (!license.device_id) {
    patch.status = STATUS.AVAILABLE;
    patch.expires_at = nextPlan === 'lifetime' ? null : patch.expires_at;
  }

  const updated = await update(license.id, patch);
  logger.info('License renewed', { license_id: license.id, plan: nextPlan });
  return publicLicense(updated || license);
}

/** Admin: read-only license details. */
export async function licenseDetails(licenseKey: string) {
  const license = await findByKey(licenseKey);
  if (!license) throw ApiError.notFound('Invalid license.', 'LICENSE_NOT_FOUND');
  const synced = await syncExpiry(license);
  return {
    ...publicLicense(synced),
    created_at: synced.created_at,
    updated_at: synced.updated_at,
  };
}
