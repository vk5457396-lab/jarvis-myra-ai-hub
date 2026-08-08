export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { validateEmail, validateEnum } from '../../../_lib/utils/validation';
import { findUserByEmail, addCreditsToUser } from '../../../_lib/services/myraAdminService';
import { publicMyraProfile } from '../../../_lib/services/myraService';

export const OPTIONS = handleOptions(['POST']);

/** Admin: add to or set a user's MYRA credit balance, by email. */
export const POST = withApi(
  async (req) => {
    await requireAdmin(req);
    const body = await req.json();
    const email = validateEmail(body.email);
    const mode = validateEnum(body.mode, 'mode', ['add', 'set'], 'add') as 'add' | 'set';
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
      throw ApiError.badRequest('amount must be an integer.', 'INVALID_FIELD', { field: 'amount' });
    }
    if (mode === 'set' && amount < 0) {
      throw ApiError.badRequest('amount must be >= 0 when mode is "set".', 'INVALID_FIELD', { field: 'amount' });
    }

    const { user, websiteProfile } = await findUserByEmail(email);
    const profile = await addCreditsToUser({ user, websiteProfile, amount, mode });

    return success({ profile: publicMyraProfile(profile) }, 'Credits updated.');
  },
  { rateLimit: { scope: 'admin-myra-credits', max: 60 } }
);
