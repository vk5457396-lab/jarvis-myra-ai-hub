'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { normalizePlan, planLabel } = require('../utils/plan');

/**
 * Signs an activation token for a device.
 * @param {object} license license row
 * @param {string} deviceId
 */
function signActivationToken(license, deviceId) {
  const payload = {
    license_id: license.id,
    license_key: license.license_key,
    plan: normalizePlan(license.plan),
    plan_label: planLabel(license.plan),
    device_id: deviceId,
    activated_at: license.activated_at,
    expires_at: license.expires_at || null,
  };

  const options = { issuer: 'myra-license-server', subject: String(license.id) };
  // A lifetime license token stays valid until manually reset; timed plans
  // expire with the license itself.
  if (license.expires_at) {
    const seconds = Math.max(
      60,
      Math.floor((new Date(license.expires_at).getTime() - Date.now()) / 1000)
    );
    options.expiresIn = seconds;
  } else {
    options.expiresIn = env.jwtExpiresIn;
  }

  return jwt.sign(payload, env.jwtSecret, options);
}

function verifyActivationToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret, { issuer: 'myra-license-server' });
  } catch (error) {
    if (error && error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Activation token expired.');
    }
    throw ApiError.unauthorized('Invalid activation token.');
  }
}

module.exports = { signActivationToken, verifyActivationToken };
