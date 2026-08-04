export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { License } from '@/lib/db/models';

export const OPTIONS = handleOptions(['POST']);

export const POST = withApi(
  async (req) => {
    await requireAdmin(req);

    const body = await req.json();
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === 'string') : [];
    if (!ids.length) throw ApiError.badRequest('ids is required.', 'MISSING_FIELD', { field: 'ids' });

    await connectMongo();
    const result = await License.deleteMany({ _id: { $in: ids } });

    return success({ deleted: result.deletedCount }, `${result.deletedCount} license(s) deleted.`);
  },
  { rateLimit: { scope: 'admin-licenses-bulk-delete', max: 20 } }
);
