export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { validateEmail } from '../../../_lib/utils/validation';
import { findUserByEmail, setCustomNameEligibility } from '../../../_lib/services/myraAdminService';
import { publicMyraProfile } from '../../../_lib/services/myraService';

export const OPTIONS = handleOptions(['POST']);

/** Admin: grant/revoke a user's eligibility for the Custom Name add-on (Rs.1500 lifetime), by
 *  email. This only flips eligibility - the user picks the actual name themselves afterward via
 *  PATCH /api/myra/profile in the app. */
export const POST = withApi(
  async (req) => {
    await requireAdmin(req);
    const body = await req.json();
    const email = validateEmail(body.email);
    if (typeof body.enabled !== 'boolean') {
      throw ApiError.badRequest('enabled must be true or false.', 'INVALID_FIELD', { field: 'enabled' });
    }

    const { user } = await findUserByEmail(email);
    const profile = await setCustomNameEligibility({ user, enabled: body.enabled });

    return success({ profile: publicMyraProfile(profile) }, 'Custom name eligibility updated.');
  },
  { rateLimit: { scope: 'admin-myra-custom-name', max: 60 } }
);
