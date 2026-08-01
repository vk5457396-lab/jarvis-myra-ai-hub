import { ApiError } from './response.js';

export function requireString(value, field, { min = 1, max = 512 } = {}) {
  if (value === undefined || value === null) {
    throw ApiError.badRequest(`${field} is required.`, 'MISSING_FIELD', { field });
  }
  const str = String(value).trim();
  if (str.length < min || str.length > max) {
    throw ApiError.badRequest(
      `${field} must be between ${min} and ${max} characters.`,
      'INVALID_FIELD',
      { field }
    );
  }
  return str;
}

export function optionalString(value, field, max = 256) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const str = String(value).trim();
  if (str.length > max) {
    throw ApiError.badRequest(`${field} must be at most ${max} characters.`, 'INVALID_FIELD', {
      field,
    });
  }
  return str;
}

export function validateLicenseKey(value) {
  const key = requireString(value, 'license_key', { min: 6, max: 128 }).toUpperCase();
  if (!/^[A-Z0-9-]+$/.test(key)) {
    throw ApiError.badRequest('license_key format is invalid.', 'INVALID_LICENSE_FORMAT');
  }
  return key;
}

export function validateDeviceId(value) {
  const id = requireString(value, 'device_id', { min: 4, max: 191 });
  if (!/^[A-Za-z0-9._:@-]+$/.test(id)) {
    throw ApiError.badRequest('device_id format is invalid.', 'INVALID_DEVICE_ID');
  }
  return id;
}

export function validateUuid(value, field) {
  const str = requireString(value, field, { min: 36, max: 36 });
  if (!/^[0-9a-fA-F-]{36}$/.test(str)) {
    throw ApiError.badRequest(`${field} must be a valid id.`, 'INVALID_FIELD', { field });
  }
  return str;
}

export function optionalUuid(value, field) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  return validateUuid(value, field);
}

export function validateFcmToken(value) {
  const token = requireString(value, 'fcm_token', { min: 20, max: 4096 });
  if (/\s/.test(token)) {
    throw ApiError.badRequest('fcm_token is invalid.', 'INVALID_FCM_TOKEN');
  }
  return token;
}

export function optionalFcmToken(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  return validateFcmToken(value);
}

export function validatePositiveInt(value, field, max = 36500) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0 || n > max) {
    throw ApiError.badRequest(`${field} must be a positive integer.`, 'INVALID_FIELD', { field });
  }
  return n;
}

export function validateEnum(value, field, allowed, fallback) {
  if (value === undefined || value === null || String(value).trim() === '') {
    if (fallback !== undefined) return fallback;
    throw ApiError.badRequest(`${field} is required.`, 'MISSING_FIELD', { field });
  }
  const str = String(value).trim().toLowerCase();
  if (!allowed.includes(str)) {
    throw ApiError.badRequest(
      `${field} must be one of: ${allowed.join(', ')}.`,
      'INVALID_FIELD',
      { field }
    );
  }
  return str;
}

export function optionalUrl(value, field) {
  const str = optionalString(value, field, 2048);
  if (!str) return null;
  try {
    const url = new URL(str);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('bad protocol');
    return url.toString();
  } catch {
    throw ApiError.badRequest(`${field} must be a valid http(s) URL.`, 'INVALID_URL', { field });
  }
}
