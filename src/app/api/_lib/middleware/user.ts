import { ApiError } from '../utils/response';
import { auth } from '@/lib/auth/config';

/** Guards endpoints that require any signed-in user (not necessarily admin). */
export async function requireUser(): Promise<{ id: string; role: 'admin' | 'user' }> {
  const session = await auth();
  if (!session?.user) throw ApiError.unauthorized('Login required.', 'AUTH_REQUIRED');
  return session.user;
}
