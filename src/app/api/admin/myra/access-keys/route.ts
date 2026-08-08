export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { optionalString, validateEmail } from '../../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { MyraAccessKey } from '@/lib/db/models';
import { MYRA_PLANS } from '../../../_lib/services/myraService';
import { generateMyraAccessKeys } from '../../../_lib/services/myraAdminService';

export const OPTIONS = handleOptions(['GET', 'POST', 'PATCH']);

function publicAccessKey(k: any) {
  return {
    id: k._id.toString(),
    key: k.key,
    plan: k.plan,
    credits: k.credits,
    duration_days: k.durationDays,
    status: k.status,
    redeemed_by: k.redeemedBy ? k.redeemedBy.toString() : null,
    redeemed_at: k.redeemedAt,
    assigned_email: k.assignedEmail || null,
    note: k.note,
    created_by: k.createdBy,
    created_at: k.createdAt,
  };
}

/** Admin: list generated MYRA access keys. */
export const GET = withApi(async (req) => {
  await requireAdmin(req);
  await connectMongo();
  const docs = await MyraAccessKey.find().sort({ createdAt: -1 }).limit(500).lean();
  return success({ keys: docs.map(publicAccessKey) });
});

/** Admin: generate one or more plan-activation access keys. */
export const POST = withApi(
  async (req) => {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const plan = String(body.plan || '').trim().toLowerCase();
    if (!MYRA_PLANS[plan]) {
      throw ApiError.badRequest(`plan must be one of: ${Object.keys(MYRA_PLANS).join(', ')}.`, 'INVALID_PLAN');
    }
    const count = Math.min(Math.max(Math.trunc(Number(body.count) || 1), 1), 100);
    const durationDays =
      body.duration_days !== undefined && body.duration_days !== null ? Number(body.duration_days) : undefined;
    const credits = body.credits !== undefined && body.credits !== null ? Number(body.credits) : undefined;
    const note = optionalString(body.note, 'note', 256);
    const assignedEmail = body.assigned_email ? validateEmail(body.assigned_email) : null;

    const docs = await generateMyraAccessKeys({
      plan,
      count,
      durationDays,
      credits,
      note,
      assignedEmail,
      createdBy: admin.via === 'session' ? admin.userId || 'admin_session' : 'admin_api_key',
    });

    return success({ keys: docs.map(publicAccessKey) }, 'Access keys generated.', 201);
  },
  { rateLimit: { scope: 'admin-myra-access-key-generate', max: 20 } }
);

/** Admin: enable/disable an unredeemed access key. */
export const PATCH = withApi(
  async (req) => {
    await requireAdmin(req);
    const body = await req.json();
    const key = String(body.key || '').trim().toUpperCase();
    if (!key) throw ApiError.badRequest('key is required.', 'MISSING_FIELD', { field: 'key' });
    const status = String(body.status || '').trim().toLowerCase();
    if (!['available', 'disabled'].includes(status)) {
      throw ApiError.badRequest('status must be "available" or "disabled".', 'INVALID_FIELD', { field: 'status' });
    }

    await connectMongo();
    const doc = await MyraAccessKey.findOneAndUpdate(
      { key, status: { $ne: 'redeemed' } },
      { $set: { status } },
      { new: true }
    );
    if (!doc) throw ApiError.notFound('Access key not found or already redeemed.', 'ACCESS_KEY_NOT_FOUND');
    return success({ key: publicAccessKey(doc) }, 'Access key updated.');
  },
  { rateLimit: { scope: 'admin-myra-access-key-update', max: 60 } }
);
