export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success } from '../../../_lib/utils/response';
import { validateEmail, validateEnum } from '../../../_lib/utils/validation';
import { findUserByEmail, setBadgeOverride } from '../../../_lib/services/myraAdminService';
import { publicMyraProfile } from '../../../_lib/services/myraService';

export const OPTIONS = handleOptions(['POST']);

/**
 * Admin: manually set a user's chat verification badge, by email.
 * badge: 'blue' | 'red' | 'yellow' | 'none' (force-hide any badge) | 'clear' (remove the
 * override entirely, reverting to the automatically computed isAdmin/subscription badge).
 */
export const POST = withApi(
  async (req) => {
    await requireAdmin(req);
    const body = await req.json();
    const email = validateEmail(body.email);
    const badgeValue = validateEnum(body.badge, 'badge', ['blue', 'red', 'yellow', 'none', 'clear']);
    const badge = badgeValue === 'clear' ? null : (badgeValue as 'blue' | 'red' | 'yellow' | 'none');

    const { user } = await findUserByEmail(email);
    const profile = await setBadgeOverride({ user, badge });

    return success({ profile: publicMyraProfile(profile) }, 'Badge updated.');
  },
  { rateLimit: { scope: 'admin-myra-badge', max: 60 } }
);
