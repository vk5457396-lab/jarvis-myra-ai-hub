'use strict';

const ApiError = require('./ApiError');

const LICENSE_KEY_RE = /^[A-Za-z0-9-]{8,64}$/;
const DEVICE_ID_RE = /^[A-Za-z0-9._:-]{4,128}$/;

function requireString(value, field, { min = 1, max = 255 } = {}) {
  if (typeof value !== 'string') {
    throw ApiError.badRequest(`${field} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw ApiError.badRequest(`${field} must be between ${min} and ${max} characters.`);
  }
  return trimmed;
}

function validateLicenseKey(value) {
  const key = requireString(value, 'license_key', { min: 8, max: 64 }).toUpperCase();
  if (!LICENSE_KEY_RE.test(key)) {
    throw ApiError.badRequest('license_key format is invalid.');
  }
  return key;
}

function validateDeviceId(value) {
  const id = requireString(value, 'device_id', { min: 4, max: 128 });
  if (!DEVICE_ID_RE.test(id)) {
    throw ApiError.badRequest('device_id format is invalid.');
  }
  return id;
}

function optionalString(value, field, max = 64) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw ApiError.badRequest(`${field} must be a string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw ApiError.badRequest(`${field} must be at most ${max} characters.`);
  }
  return trimmed;
}

function validatePositiveInt(value, field, max = 36500) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0 || n > max) {
    throw ApiError.badRequest(`${field} must be an integer between 1 and ${max}.`);
  }
  return n;
}

module.exports = {
  requireString,
  validateLicenseKey,
  validateDeviceId,
  optionalString,
  validatePositiveInt,
};
