export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import { success } from '../../../_lib/utils/response';
import { requireString } from '../../../_lib/utils/validation';
import { Profile } from '@/lib/db/models';
import { redeemMyraAccessKey } from '../../../_lib/services/myraAdminService';
import { publicMyraProfile, publicSubscription } from '../../../_lib/services/myraService';

export const OPTIONS = handleOptions(['POST']);

/** Mobile: redeem an admin-issued access key to activate a MYRA plan on this account. */
export const POST = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const body = await req.json();
    const key = requireString(body.key, 'key', { min: 6, max: 128 });

    const websiteProfile = await Profile.findOne({ email: user.email });
    const { profile, subscription } = await redeemMyraAccessKey({ user, websiteProfile, key });

    return success(
      { subscription: publicSubscription(subscription), profile: publicMyraProfile(profile) },
      'Access key redeemed. Plan activated.'
    );
  },
  { rateLimit: { scope: 'myra-access-key-redeem', max: 20 } }
);
