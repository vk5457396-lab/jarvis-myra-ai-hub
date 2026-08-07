import { NextRequest } from 'next/server';
import { ApiError } from '../utils/response';
import { verifyMobileAccessToken } from '../utils/mobileJwt';
import { connectMongo } from '@/lib/db/mongoose';
import { User } from '@/lib/db/models';

export async function requireMobileUser(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentication token missing.', 'TOKEN_MISSING');
  }

  const token = auth.slice(7).trim();
  if (!token) {
    throw ApiError.unauthorized('Authentication token missing.', 'TOKEN_MISSING');
  }

  const claims = verifyMobileAccessToken(token);
  await connectMongo();
  const user = await User.findById(claims.sub);
  if (!user) throw ApiError.unauthorized('User account not found.', 'USER_NOT_FOUND');

  return { user, claims };
}
