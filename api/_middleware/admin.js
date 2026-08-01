import crypto from 'node:crypto';
import { ApiError } from '../_utils/response.js';
import { getSupabase } from '../_utils/supabase.js';

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Guards admin-only endpoints. Two credentials are accepted:
 *  1. `x-admin-key` (or `Authorization: Bearer <key>`) matching ADMIN_API_KEY -
 *     used by server-to-server tooling.
 *  2. A signed-in Supabase access token belonging to a user with the `admin`
 *     role - used by the website admin panel.
 */
export async function requireAdmin(req) {
  const expected = process.env.ADMIN_API_KEY;
  const headerKey = req.headers['x-admin-key'];
  const auth = req.headers.authorization;
  const bearer = auth && auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;

  if (expected) {
    if (headerKey && timingSafeEqual(headerKey, expected)) return { via: 'api_key' };
    if (bearer && bearer.length === expected.length && timingSafeEqual(bearer, expected)) {
      return { via: 'api_key' };
    }
  }

  if (bearer) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser(bearer);
    if (!error && data?.user) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin');
      if (roles && roles.length) return { via: 'session', userId: data.user.id };
    }
  }

  throw ApiError.unauthorized('Invalid admin credentials.', 'INVALID_ADMIN_KEY');
}
