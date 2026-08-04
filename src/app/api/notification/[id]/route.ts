export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireAdmin } from '../../_lib/middleware/admin';
import { success, ApiError } from '../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { Notification } from '@/lib/db/models';

export const OPTIONS = handleOptions(['DELETE']);

export const DELETE = withApi(
  async (req) => {
    await requireAdmin(req);
    const id = req.nextUrl.pathname.split('/').pop()!;

    await connectMongo();
    const doc = await Notification.findByIdAndDelete(id);
    if (!doc) throw ApiError.notFound('Notification not found.', 'NOTIFICATION_NOT_FOUND');

    return success({}, 'Deleted.');
  },
  { rateLimit: { scope: 'notification-delete', max: 60 } }
);
