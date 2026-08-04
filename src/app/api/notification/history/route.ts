export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextRequest } from 'next/server';
import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireAdmin } from '../../_lib/middleware/admin';
import { success, ApiError } from '../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { Notification } from '@/lib/db/models';
import { toLegacyNotification } from '../../_lib/services/notificationService';

export const OPTIONS = handleOptions(['GET', 'POST']);

async function core(req: NextRequest) {
  await requireAdmin(req);

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || 50) || 50, 200);
  const offset = Math.max(Number(url.searchParams.get('offset') || 0) || 0, 0);

  await connectMongo();

  let docs, total;
  try {
    [docs, total] = await Promise.all([
      Notification.find().sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
      Notification.countDocuments(),
    ]);
  } catch {
    throw ApiError.internal('Database error.', 'DB_ERROR');
  }

  return success(
    { notifications: docs.map(toLegacyNotification), total, limit, offset },
    'History.'
  );
}

const handler = withApi(core, { rateLimit: { scope: 'notification-history', max: 120 } });

export const GET = handler;
export const POST = handler;
