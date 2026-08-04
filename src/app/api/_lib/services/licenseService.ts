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
import { connectMongo } from '@/lib/db/mongoose';
import { License, LicenseSettings, LICENSE_SETTINGS_ID } from '@/lib/db/models';

/**
 * jwt.ts / plan.ts operate on plain objects shaped like the old Supabase rows
 * (snake_case, `id` instead of `_id`). This bridge keeps those two shared
 * utilities untouched — Mongo documents are translated in and out here.
 */
function toLegacy(doc: any) {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    license_key: doc.licenseKey,
    plan: doc.plan,
    duration: doc.duration ?? null,
    status: doc.status,
    device_id: doc.deviceId ?? null,
    created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    activated_at: doc.activatedAt ? new Date(doc.activatedAt).toISOString() : null,
    expires_at: doc.expiresAt ? new Date(doc.expiresAt).toISOString() : null,
    updated_at: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    activation_token: doc.activationToken ?? null,
  };
}

const PATCH_KEY_MAP: Record<string, string> = {
  license_key: 'licenseKey',
  device_id: 'deviceId',
  activated_at: 'activatedAt',
  expires_at: 'expiresAt',
  activation_token: 'activationToken',
};

function mapPatch(patch: Record<string, any>): Record<string, any> {
  const mapped: Record<string, any> = {};
  for (const [key, value] of Object.entries(patch)) {
    mapped[PATCH_KEY_MAP[key] || key] = value;
  }
  return mapped;
}

export async function findByKey(licenseKey: string) {
  await connectMongo();
  const doc = await License.findOne({ licenseKey }).lean();
  return toLegacy(doc);
}

export async function findById(id: string) {
  await connectMongo();
  const doc = await License.findById(id).lean().catch(() => null);
  return toLegacy(doc);
}

export async function update(id: string, patch: Record<string, any>) {
  await connectMongo();
  const doc = await License.findByIdAndUpdate(id, { $set: mapPatch(patch) }, { new: true }).lean();
  return toLegacy(doc);
}

/** Atomically binds a free license to a device (wins the race or returns null). */
async function claimForDevice(id: string, patch: Record<string, any>) {
  await connectMongo();
  const doc = await License.findOneAndUpdate(
    { _id: id, deviceId: null },
    { $set: mapPatch(patch) },
    { new: true }
  ).lean();
  return toLegacy(doc);
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
  await connectMongo();
  const normalized = normalizePlan(plan);
  const duration = planDurationDays(normalized);

  const settings = await LicenseSettings.findById(LICENSE_SETTINGS_ID).lean();

  const usedPrefix = prefix || settings?.prefix || 'MYRA';
  const usedLength = length || settings?.randomLength || 16;

  const existingKeys = await License.distinct('licenseKey');
  const taken = new Set(existingKeys);
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

  const rows = keys.map((licenseKey) => ({
    licenseKey,
    plan: normalized,
    duration,
    status: STATUS.AVAILABLE,
  }));

  const inserted = await License.insertMany(rows);

  logger.info('Licenses generated', { count: keys.length, plan: normalized });

  return {
    plan: planLabel(normalized),
    plan_id: normalized,
    count: inserted.length,
    licenses: inserted.map((doc) => ({
      license_key: doc.licenseKey,
      plan: doc.plan,
      duration: doc.duration,
      status: doc.status,
      created_at: doc.createdAt,
    })),
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

/** Admin: re-enable a previously disabled license, restoring its natural status. */
export async function enableLicense(licenseKey: string) {
  const license = await findByKey(licenseKey);
  if (!license) throw ApiError.notFound('Invalid license.', 'LICENSE_NOT_FOUND');

  const nextStatus = license.device_id
    ? isExpired(license.expires_at)
      ? STATUS.EXPIRED
      : STATUS.ACTIVATED
    : STATUS.AVAILABLE;

  const updated = await update(license.id, { status: nextStatus });
  logger.info('License enabled', { license_id: license.id });
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
