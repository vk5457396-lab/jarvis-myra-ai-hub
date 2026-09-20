export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { optionalString, validateEmail } from '../../../_lib/utils/validation';
import { MYRA_PLANS } from '../../../_lib/services/myraService';
import {
  generateFirebaseAccessKeys,
  listFirebaseAccessKeys,
  setFirebaseAccessKeyStatus,
} from '../../../_lib/services/myraAccessKeyFirestoreService';

export const OPTIONS = handleOptions(['GET', 'POST', 'PATCH']);

/**
 * Admin: generate/list/enable/disable MYRA access keys.
 *
 * Firestore-backed (see myraAccessKeyFirestoreService.ts), NOT MongoDB - the Android app
 * redeems a key by reading/writing the same Firestore collection directly, with no HTTP call to
 * this website at all. This route's job is only to let the admin panel manage that collection;
 * the request/response shape is unchanged from the old Mongo-backed version so the existing
 * MyraAdminPage.tsx UI needed no changes.
 */
export const GET = withApi(async (req) => {
  await requireAdmin(req);
  const keys = await listFirebaseAccessKeys();
  return success({ keys });
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
    const note = optionalString(body.note, 'note', 256);
    const assignedEmail = body.assigned_email ? validateEmail(body.assigned_email) : null;

    const keys = await generateFirebaseAccessKeys({
      plan,
      count,
      durationDays,
      note,
      assignedEmail,
      createdBy: admin.via === 'session' ? admin.userId || 'admin_session' : 'admin_api_key',
    });

    return success({ keys }, 'Access keys generated.', 201);
  },
  { rateLimit: { scope: 'admin-myra-access-key-generate', max: 20 } }
);

/** Admin: block/unblock an access key - works on an unredeemed key AND one a device has
 *  already redeemed (see setFirebaseAccessKeyStatus for the redeemed-key revocation path). */
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

    const updated = await setFirebaseAccessKeyStatus(key, status as 'available' | 'disabled');
    return success({ key: updated }, 'Access key updated.');
  },
  { rateLimit: { scope: 'admin-myra-access-key-update', max: 60 } }
);
