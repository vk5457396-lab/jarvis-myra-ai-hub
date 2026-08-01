import { ApiError } from '../_utils/response.js';
import { verifyActivationToken } from '../_utils/jwt.js';

/** Extracts and verifies the device activation JWT. */
export function authenticateDevice(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Activation token missing.', 'TOKEN_MISSING');
  }
  const token = auth.slice(7).trim();
  if (!token) throw ApiError.unauthorized('Activation token missing.', 'TOKEN_MISSING');

  const payload = verifyActivationToken(token);
  req.deviceToken = token;
  req.devicePayload = payload;
  return payload;
}
