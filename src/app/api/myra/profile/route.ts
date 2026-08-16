export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireMobileUser } from '../../_lib/middleware/mobileAuth';
import { success, ApiError } from '../../_lib/utils/response';
import { optionalString } from '../../_lib/utils/validation';
import { effectiveDiscountPercent, ensureMyraState, publicMyraProfile } from '../../_lib/services/myraService';
import { MyraProfile, Profile } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET', 'PATCH']);

export const GET = withApi(async (req) => {
  const { user } = await requireMobileUser(req);
  const websiteProfile = await Profile.findOne({ email: user.email });
  const state = await ensureMyraState(user, websiteProfile);
  const discountPercent = await effectiveDiscountPercent(state.profile.discountPercent);
  return success({ profile: publicMyraProfile(state.profile, discountPercent) });
});

export const PATCH = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const body = await req.json();
    const set: Record<string, any> = {};

    // Note: this only renames the display name shown around the app - it does not
    // touch usernameLower, so it can never collide with someone's unique @handle.
    // Claiming/changing the actual chat handle goes through POST /api/myra/username.
    const username = optionalString(body.username, 'username', 120);
    if (username !== null) set.username = username;
    const bio = optionalString(body.bio, 'bio', 280);
    if (bio !== null) set.bio = bio;
    const avatar = optionalString(body.avatar, 'avatar', 2000);
    if (avatar !== null) set.avatar = avatar;
    const language = optionalString(body.language, 'language', 20);
    if (language !== null) set.language = language;
    const voice = optionalString(body.voice, 'voice', 80);
    if (voice !== null) set.voice = voice;
    const personality = optionalString(body.ai_personality, 'ai_personality', 80);
    if (personality !== null) set.aiPersonality = personality;
    if (body.preferences && typeof body.preferences === 'object' && !Array.isArray(body.preferences)) {
      set.preferences = body.preferences;
    }

    // Custom Name add-on: server-enforced, not just hidden in the app UI - eligibility
    // (customNameEnabled) is admin-only (POST /api/admin/myra/custom-name), but once granted the
    // user picks the actual name themselves, here, any time.
    if (body.custom_assistant_name !== undefined) {
      const existing = await MyraProfile.findOne({ userId: user._id }).select('customNameEnabled');
      if (!existing?.customNameEnabled) {
        throw ApiError.forbidden(
          'Custom Name is not enabled on this account yet.',
          'CUSTOM_NAME_NOT_ELIGIBLE'
        );
      }
      const customName = optionalString(body.custom_assistant_name, 'custom_assistant_name', 40);
      set.customAssistantName = customName;
    }

    const profile = await MyraProfile.findOneAndUpdate(
      { userId: user._id },
      { $set: set },
      { new: true }
    );
    if (!profile) throw ApiError.notFound('MYRA profile not found.', 'MYRA_PROFILE_NOT_FOUND');
    return success({ profile: publicMyraProfile(profile) }, 'Profile updated.');
  },
  { rateLimit: { scope: 'myra-profile-update', max: 30 } }
);
