export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { validateEmail } from '../../../_lib/utils/validation';
import { findUserByEmail, applyPlanToUser } from '../../../_lib/services/myraAdminService';
import { publicMyraProfile, publicSubscription, MYRA_PLANS } from '../../../_lib/services/myraService';

export const OPTIONS = handleOptions(['POST']);

/** Admin: manually set a user's MYRA plan/expiry/credits, by email. */
export const POST = withApi(
  async (req) => {
    await requireAdmin(req);
    const body = await req.json();
    const email = validateEmail(body.email);
    const plan = String(body.plan || '').trim().toLowerCase();
    if (!MYRA_PLANS[plan]) {
      throw ApiError.badRequest(`plan must be one of: ${Object.keys(MYRA_PLANS).join(', ')}.`, 'INVALID_PLAN');
    }
    const durationDays =
      body.duration_days !== undefined && body.duration_days !== null ? Number(body.duration_days) : undefined;
    const credits = body.credits !== undefined && body.credits !== null ? Number(body.credits) : undefined;

    const { user, websiteProfile } = await findUserByEmail(email);
    const { profile, subscription } = await applyPlanToUser({
      user,
      websiteProfile,
      plan,
      durationDays,
      credits,
    });

    return success(
      { profile: publicMyraProfile(profile), subscription: publicSubscription(subscription) },
      'Plan updated.'
    );
  },
  { rateLimit: { scope: 'admin-myra-plan', max: 60 } }
);
