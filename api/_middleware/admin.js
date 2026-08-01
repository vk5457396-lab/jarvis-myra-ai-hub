import crypto from 'node:crypto';
import { ApiError } from '../_utils/response.js';

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Guards admin-only endpoints with a shared secret supplied through the
 * `x-admin-key` header or an `Authorization: Bearer <key>` header.
 */
export function requireAdmin(req) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    throw ApiError.internal('Backend is not configured.', 'ADMIN_KEY_NOT_CONFIGURED');
  }

  const header = req.headers['x-admin-key'];
  const auth = req.headers.authorization;
  const provided = header || (auth && auth.startsWith('Bearer ') ? auth.slice(7) : null);

  if (!provided || !timingSafeEqual(provided, expected)) {
    throw ApiError.unauthorized('Invalid admin credentials.', 'INVALID_ADMIN_KEY');
  }

  return true;
}
