import { ApiError } from './response';

export function requireString(value: unknown, field: string, { min = 1, max = 512 } = {}): string {
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

export function optionalString(value: unknown, field: string, max = 256): string | null {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const str = String(value).trim();
  if (str.length > max) {
    throw ApiError.badRequest(`${field} must be at most ${max} characters.`, 'INVALID_FIELD', {
      field,
    });
  }
  return str;
}

export function validateLicenseKey(value: unknown): string {
  const key = requireString(value, 'license_key', { min: 6, max: 128 }).toUpperCase();
  if (!/^[A-Z0-9-]+$/.test(key)) {
    throw ApiError.badRequest('license_key format is invalid.', 'INVALID_LICENSE_FORMAT');
  }
  return key;
}

export function validateDeviceId(value: unknown): string {
  const id = requireString(value, 'device_id', { min: 4, max: 191 });
  if (!/^[A-Za-z0-9._:@-]+$/.test(id)) {
    throw ApiError.badRequest('device_id format is invalid.', 'INVALID_DEVICE_ID');
  }
  return id;
}

export function validateUuid(value: unknown, field: string): string {
  const str = requireString(value, field, { min: 36, max: 36 });
  if (!/^[0-9a-fA-F-]{36}$/.test(str)) {
    throw ApiError.badRequest(`${field} must be a valid id.`, 'INVALID_FIELD', { field });
  }
  return str;
}

export function optionalUuid(value: unknown, field: string): string | null {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  return validateUuid(value, field);
}

export function validateFcmToken(value: unknown): string {
  const token = requireString(value, 'fcm_token', { min: 20, max: 4096 });
  if (/\s/.test(token)) {
    throw ApiError.badRequest('fcm_token is invalid.', 'INVALID_FCM_TOKEN');
  }
  return token;
}

export function optionalFcmToken(value: unknown): string | null {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  return validateFcmToken(value);
}

export function validatePositiveInt(value: unknown, field: string, max = 36500): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0 || n > max) {
    throw ApiError.badRequest(`${field} must be a positive integer.`, 'INVALID_FIELD', { field });
  }
  return n;
}

export function validateEnum(
  value: unknown,
  field: string,
  allowed: string[],
  fallback?: string
): string {
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

export function validateEmail(value: unknown): string {
  const str = requireString(value, 'email', { min: 3, max: 255 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
    throw ApiError.badRequest('email must be a valid email address.', 'INVALID_EMAIL');
  }
  return str;
}

export function optionalUrl(value: unknown, field: string): string | null {
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

/**
 * Same as optionalUrl, plus rejects GitHub release/tag HTML pages
 * (github.com/OWNER/REPO/releases/tag/...) - the page a human reading the release lands on,
 * not the binary. Pasting that instead of the .../releases/download/TAG/FILE asset link is an
 * easy mistake in the admin panel, and the Android updater would download an HTML document and
 * fail to install it with a confusing "not a valid MYRA installer" error. Only applies the
 * GitHub-specific check to github.com hosts - MediaFire/Drive/Dropbox links pass through
 * unchanged, same as optionalUrl.
 */
export function validateApkAssetUrl(value: unknown, field = 'apk_asset_url'): string | null {
  const url = optionalUrl(value, field);
  if (!url) return null;
  const parsed = new URL(url);
  if (/(^|\.)github\.com$/i.test(parsed.hostname) && /\/releases\/tag\//i.test(parsed.pathname)) {
    throw ApiError.badRequest(
      `${field} must link directly to the release APK asset (.../releases/download/TAG/FILE.apk), not the release page (.../releases/tag/...).`,
      'INVALID_APK_URL',
      { field }
    );
  }
  return url;
}

/** Exactly 64 hex characters (a SHA-256 digest), normalized to lowercase. */
export function validateSha256(value: unknown, field = 'sha256'): string {
  const str = requireString(value, field, { min: 64, max: 64 }).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(str)) {
    throw ApiError.badRequest(`${field} must be exactly 64 hexadecimal characters.`, 'INVALID_SHA256', { field });
  }
  return str;
}

/** Optional variant - only validates when a non-blank value is actually provided. */
export function optionalSha256(value: unknown, field = 'sha256'): string | null {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  return validateSha256(value, field);
}
