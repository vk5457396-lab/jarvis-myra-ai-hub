export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextRequest } from 'next/server';
import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireAdmin } from '../../_lib/middleware/admin';
import { success, ApiError } from '../../_lib/utils/response';
import { getSupabase } from '../../_lib/utils/supabase';

export const OPTIONS = handleOptions(['GET', 'POST']);

async function core(req: NextRequest) {
  await requireAdmin(req);

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || 50) || 50, 200);
  const offset = Math.max(Number(url.searchParams.get('offset') || 0) || 0, 0);

  const supabase = getSupabase();
  const { data, error, count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw ApiError.internal('Database error.', 'DB_ERROR');

  return success({ notifications: data || [], total: count || 0, limit, offset }, 'History.');
}

const handler = withApi(core, { rateLimit: { scope: 'notification-history', max: 120 } });

export const GET = handler;
export const POST = handler;
