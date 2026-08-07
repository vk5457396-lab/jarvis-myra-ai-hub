export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireMobileUser } from '../../_lib/middleware/mobileAuth';
import { success } from '../../_lib/utils/response';
import {
  ensureMyraState,
  publicMyraProfile,
  publicSubscription,
} from '../../_lib/services/myraService';
import { Profile } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

export const GET = withApi(async (req) => {
  const { user } = await requireMobileUser(req);
  const websiteProfile = await Profile.findOne({ email: user.email });
  const state = await ensureMyraState(user, websiteProfile);
  return success({
    subscription: publicSubscription(state.subscription),
    profile: publicMyraProfile(state.profile),
  });
});
