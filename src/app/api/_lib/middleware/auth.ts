import { NextRequest } from 'next/server';
import { ApiError } from '../utils/response';
import { verifyActivationToken } from '../utils/jwt';

/** Extracts and verifies the device activation JWT. Returns it instead of mutating req. */
export function authenticateDevice(req: NextRequest): { deviceToken: string; devicePayload: any } {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Activation token missing.', 'TOKEN_MISSING');
  }
  const token = auth.slice(7).trim();
  if (!token) throw ApiError.unauthorized('Activation token missing.', 'TOKEN_MISSING');

  const payload = verifyActivationToken(token);
  return { deviceToken: token, devicePayload: payload };
}
