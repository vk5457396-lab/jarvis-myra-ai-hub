import jwt from 'jsonwebtoken';
import { ApiError } from './response';
import { normalizePlan, planLabel } from './plan';

const ISSUER = 'myra-license-server';

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) throw ApiError.internal('Backend is not configured.', 'JWT_NOT_CONFIGURED');
  return value;
}

/** Signs an activation token bound to one device. */
export function signActivationToken(license: any, deviceId: string): string {
  const payload = {
    license_id: license.id,
    license_key: license.license_key,
    plan: normalizePlan(license.plan),
    plan_label: planLabel(license.plan),
    device_id: deviceId,
    activated_at: license.activated_at,
    expires_at: license.expires_at || null,
  };

  const options: jwt.SignOptions = { issuer: ISSUER, subject: String(license.id) };

  if (license.expires_at) {
    options.expiresIn = Math.max(
      60,
      Math.floor((new Date(license.expires_at).getTime() - Date.now()) / 1000)
    );
  } else {
    options.expiresIn = (process.env.JWT_EXPIRES_IN || '365d') as any;
  }

  return jwt.sign(payload, secret(), options);
}

export function verifyActivationToken(token: string): any {
  try {
    return jwt.verify(token, secret(), { issuer: ISSUER });
  } catch (error: any) {
    if (error && error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Activation token expired.', 'TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Invalid activation token.', 'INVALID_TOKEN');
  }
}
