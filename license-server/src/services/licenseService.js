'use strict';

const repo = require('./licenseRepository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { STATUS } = require('../config/constants');
const { signActivationToken, verifyActivationToken } = require('./jwtService');
const { normalizePlan, planLabel, computeExpiry, isExpired } = require('../utils/plan');

/** Shared public shape returned to the Android client. */
function publicLicense(license) {
  return {
    license_key: license.license_key,
    plan: planLabel(license.plan),
    plan_id: normalizePlan(license.plan),
    status: license.status,
    device_id: license.device_id || null,
    activated_at: license.activated_at || null,
    expires_at: license.expires_at || null,
  };
}

/** Marks a timed license expired in the database once its window has passed. */
async function syncExpiry(license) {
  if (license.status !== STATUS.EXPIRED && isExpired(license.expires_at)) {
    const updated = await repo.update(license.id, {
      status: STATUS.EXPIRED,
      activation_token: null,
    });
    return updated || { ...license, status: STATUS.EXPIRED };
  }
  return license;
}

/**
 * Verify / activate a license for a device.
 * Throws ApiError for every non-success case so responses stay uniform JSON.
 */
async function verify({ licenseKey, deviceId, appVersion, androidVersion }) {
  const found = await repo.findByKey(licenseKey);
  if (!found) {
    throw ApiError.notFound('Invalid license.');
  }

  let license = await syncExpiry(found);

  if (license.status === STATUS.DISABLED) {
    throw ApiError.forbidden('License disabled.');
  }

  if (license.device_id && license.device_id !== deviceId) {
    throw ApiError.conflict('License already activated on another device.');
  }

  // Re-verification from the same device.
  if (license.device_id === deviceId) {
    if (isExpired(license.expires_at)) {
      throw ApiError.forbidden('License expired.');
    }
    const token = signActivationToken(license, deviceId);
    await repo.update(license.id, { activation_token: token });
    return {
      plan: planLabel(license.plan),
      plan_id: normalizePlan(license.plan),
      expires_at: license.expires_at || null,
      activated_at: license.activated_at,
      activation_token: token,
      license: publicLicense(license),
    };
  }

  // First activation - expiry starts now, never from creation date.
  const activatedAt = new Date();
  const expiresAt = computeExpiry(license, activatedAt);
  const claimed = await repo.claimForDevice(license.id, {
    device_id: deviceId,
    activated_at: activatedAt.toISOString(),
    expires_at: expiresAt,
    status: STATUS.ACTIVATED,
  });

  if (!claimed) {
    // Another device won the race between the read and the write.
    throw ApiError.conflict('License already activated on another device.');
  }

  const token = signActivationToken(claimed, deviceId);
  const withToken = (await repo.update(claimed.id, { activation_token: token })) || claimed;

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

/** Validates a device token and returns the latest license status. */
async function check({ token, deviceId }) {
  const payload = verifyActivationToken(token);

  const license = await repo.findById(payload.license_id);
  if (!license) {
    throw ApiError.notFound('Invalid license.');
  }

  const synced = await syncExpiry(license);

  if (deviceId && payload.device_id !== deviceId) {
    throw ApiError.forbidden('Token does not belong to this device.');
  }
  if (synced.device_id && payload.device_id !== synced.device_id) {
    throw ApiError.forbidden('License is bound to another device.');
  }
  if (synced.status === STATUS.DISABLED) {
    throw ApiError.forbidden('License disabled.');
  }
  if (isExpired(synced.expires_at)) {
    throw ApiError.forbidden('License expired.');
  }

  return { valid: true, ...publicLicense(synced) };
}

/** Admin: unbind the device but keep the license usable. */
async function resetDevice(licenseKey) {
  const license = await repo.findByKey(licenseKey);
  if (!license) throw ApiError.notFound('Invalid license.');

  const updated = await repo.update(license.id, {
    device_id: null,
    activation_token: null,
    activated_at: null,
    expires_at: null,
    status: license.status === STATUS.DISABLED ? STATUS.DISABLED : STATUS.AVAILABLE,
  });

  logger.info('License device reset', { license_id: license.id });
  return publicLicense(updated || license);
}

/** Admin: disable a license immediately. */
async function deactivate(licenseKey) {
  const license = await repo.findByKey(licenseKey);
  if (!license) throw ApiError.notFound('Invalid license.');

  const updated = await repo.update(license.id, {
    status: STATUS.DISABLED,
    activation_token: null,
  });

  logger.info('License disabled', { license_id: license.id });
  return publicLicense(updated || license);
}

/** Admin: extend a license, optionally switching its plan. */
async function renew(licenseKey, { days, plan }) {
  const license = await repo.findByKey(licenseKey);
  if (!license) throw ApiError.notFound('Invalid license.');

  const nextPlan = plan ? normalizePlan(plan) : normalizePlan(license.plan);
  const patch = { plan: nextPlan, status: STATUS.ACTIVATED };

  if (nextPlan === 'lifetime' && !days) {
    patch.expires_at = null;
  } else {
    const addDays = days || null;
    const base =
      license.expires_at && !isExpired(license.expires_at)
        ? new Date(license.expires_at)
        : new Date();
    const effectiveDays = addDays ?? 30;
    patch.expires_at = new Date(base.getTime() + effectiveDays * 86400000).toISOString();
  }

  if (!license.device_id) {
    patch.status = STATUS.AVAILABLE;
    patch.expires_at = nextPlan === 'lifetime' ? null : patch.expires_at;
  }

  const updated = await repo.update(license.id, patch);
  logger.info('License renewed', { license_id: license.id, plan: nextPlan });
  return publicLicense(updated || license);
}

/** Admin: read-only license details. */
async function details(licenseKey) {
  const license = await repo.findByKey(licenseKey);
  if (!license) throw ApiError.notFound('Invalid license.');
  const synced = await syncExpiry(license);
  return {
    ...publicLicense(synced),
    created_at: synced.created_at,
    updated_at: synced.updated_at,
  };
}

module.exports = { verify, check, resetDevice, deactivate, renew, details, publicLicense };
