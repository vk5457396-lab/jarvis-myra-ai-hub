import { createHandler } from '../_middleware/handler.js';
import { rateLimit } from '../_middleware/rateLimit.js';
import { requireAdmin } from '../_middleware/admin.js';
import { success, ApiError } from '../_utils/response.js';
import { getSupabase } from '../_utils/supabase.js';

export default createHandler(['GET', 'POST'], async (req, res) => {
  rateLimit(req, { scope: 'notification-history', max: 120 });
  requireAdmin(req);

  const url = new URL(req.url, 'http://localhost');
  const limit = Math.min(Number(url.searchParams.get('limit') || 50) || 50, 200);
  const offset = Math.max(Number(url.searchParams.get('offset') || 0) || 0, 0);

  const supabase = getSupabase();
  const { data, error, count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw ApiError.internal('Database error.', 'DB_ERROR');

  return success(res, { notifications: data || [], total: count || 0, limit, offset }, 'History.');
});
