export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireMobileUser } from '../../_lib/middleware/mobileAuth';
import { success, ApiError } from '../../_lib/utils/response';
import { validateEnum } from '../../_lib/utils/validation';
import { ensureMyraState, publicMyraProfile, publicUsage } from '../../_lib/services/myraService';
import { MyraProfile, MyraUsage, Profile } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET', 'POST']);

export const GET = withApi(async (req) => {
  const { user } = await requireMobileUser(req);
  const websiteProfile = await Profile.findOne({ email: user.email });
  const state = await ensureMyraState(user, websiteProfile);
  return success({
    usage: publicUsage(state.usage),
    profile: publicMyraProfile(state.profile),
  });
});

export const POST = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const body = await req.json();
    const action = validateEnum(
      body.action,
      'action',
      ['automation', 'prompt', 'voice', 'image']
    );
    const rawAmount = Number(body.amount || 1);
    const amount = Number.isFinite(rawAmount) ? Math.min(Math.max(rawAmount, 1), 1000) : 1;

    const profile = await MyraProfile.findOne({ userId: user._id });
    if (!profile) throw ApiError.notFound('MYRA profile not found.', 'MYRA_PROFILE_NOT_FOUND');
    const unlimited = ['membership', 'lifetime', 'admin'].includes(profile.subscriptionType);
    if (!unlimited) {
      const updated = await MyraProfile.findOneAndUpdate(
        { userId: user._id, credits: { $gte: amount } },
        { $inc: { credits: -amount } },
        { new: true }
      );
      if (!updated) throw ApiError.forbidden('Insufficient credits.', 'INSUFFICIENT_CREDITS');
    }

    const increments: Record<string, number> = { creditsUsed: amount };
    if (action === 'automation') increments.automationCount = amount;
    if (action === 'prompt') increments.promptsCount = amount;
    if (action === 'voice') increments.voiceMinutes = amount;
    if (action === 'image') increments.imageGenerations = amount;

    const usage = await MyraUsage.findOneAndUpdate(
      { userId: user._id },
      { $inc: increments, $setOnInsert: { userId: user._id, lastReset: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const currentProfile = await MyraProfile.findOne({ userId: user._id });
    return success({
      usage: publicUsage(usage),
      profile: publicMyraProfile(currentProfile),
    });
  },
  { rateLimit: { scope: 'myra-usage-write', max: 240 } }
);
