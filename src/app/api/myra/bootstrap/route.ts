export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireMobileUser } from '../../_lib/middleware/mobileAuth';
import { success } from '../../_lib/utils/response';
import {
  ensureMyraState,
  publicDevice,
  publicMyraProfile,
  publicSettings,
  publicSubscription,
  publicUsage,
  publicUser,
} from '../../_lib/services/myraService';
import { MyraDevice, Profile } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

export const GET = withApi(async (req) => {
  const { user, claims } = await requireMobileUser(req);
  const websiteProfile = await Profile.findOne({ email: user.email });
  const state = await ensureMyraState(user, websiteProfile);
  const devices = await MyraDevice.find({ userId: user._id }).sort({ lastLogin: -1 });

  return success({
    user: publicUser(user, claims.role),
    profile: publicMyraProfile(state.profile),
    subscription: publicSubscription(state.subscription),
    usage: publicUsage(state.usage),
    settings: publicSettings(state.settings),
    devices: devices.map(publicDevice),
  });
});
