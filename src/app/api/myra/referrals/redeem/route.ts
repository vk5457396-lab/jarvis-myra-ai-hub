export const runtime = 'nodejs';
export const maxDuration = 15;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import { success, ApiError } from '../../../_lib/utils/response';
import { requireString } from '../../../_lib/utils/validation';
import { publicMyraProfile } from '../../../_lib/services/myraService';
import { connectMongo } from '@/lib/db/mongoose';
import { MyraProfile } from '@/lib/db/models';

export const OPTIONS = handleOptions(['POST']);

// One-time redemption: whoever entered this code becomes permanently attributed to the
// referrer. The actual credit is granted later, by subscription/verify, on this user's FIRST
// paid subscription - not here, so entering a code by itself never pays out anything.
export const POST = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const body = await req.json();
    const code = requireString(body.code, 'code', { min: 4, max: 12 }).trim().toUpperCase();

    await connectMongo();

    const myProfile = await MyraProfile.findOne({ userId: user._id }).select('referredByCode');
    if (!myProfile) throw ApiError.notFound('MYRA profile not found.', 'MYRA_PROFILE_NOT_FOUND');
    if (myProfile.referredByCode) {
      throw ApiError.conflict('You have already redeemed a referral code.', 'REFERRAL_ALREADY_REDEEMED');
    }

    const referrer = await MyraProfile.findOne({ referralCode: code }).select('userId');
    if (!referrer) throw ApiError.notFound('Invalid referral code.', 'REFERRAL_CODE_NOT_FOUND');
    if (referrer.userId.toString() === user._id.toString()) {
      throw ApiError.badRequest("You can't redeem your own referral code.", 'REFERRAL_SELF_REDEEM');
    }

    const profile = await MyraProfile.findOneAndUpdate(
      { userId: user._id },
      { $set: { referredByCode: code } },
      { new: true }
    );
    return success({ profile: publicMyraProfile(profile) }, 'Referral code applied.');
  },
  { rateLimit: { scope: 'myra-referral-redeem', max: 10 } }
);
