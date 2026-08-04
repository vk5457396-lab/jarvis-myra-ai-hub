export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireAdmin } from '../../_lib/middleware/admin';
import { success } from '../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { License } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

/** Admin: full license list for the license-management dashboard. */
export const GET = withApi(async (req) => {
  await requireAdmin(req);
  await connectMongo();

  const docs = await License.find().sort({ createdAt: -1 }).lean();

  return success({
    licenses: docs.map((l: any) => ({
      id: l._id.toString(),
      license_key: l.licenseKey,
      plan: l.plan,
      duration: l.duration,
      status: l.status,
      device_id: l.deviceId,
      created_at: l.createdAt,
      activated_at: l.activatedAt,
      expires_at: l.expiresAt,
      created_by: l.createdBy ? l.createdBy.toString() : null,
    })),
  });
});
