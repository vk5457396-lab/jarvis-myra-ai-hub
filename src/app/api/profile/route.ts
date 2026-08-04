export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../_lib/middleware/handler';
import { requireUser } from '../_lib/middleware/user';
import { success, ApiError } from '../_lib/utils/response';
import { optionalString } from '../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { Profile } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET', 'PATCH']);

function toPublicProfile(doc: any) {
  return {
    id: doc._id.toString(),
    full_name: doc.fullName,
    email: doc.email,
    phone: doc.phone,
    referral_code: doc.referralCode,
    wallet_balance: doc.walletBalance,
    role: doc.role,
    created_at: doc.createdAt,
  };
}

export const GET = withApi(async () => {
  const user = await requireUser();
  await connectMongo();
  const profile = await Profile.findById(user.id);
  if (!profile) throw ApiError.notFound('Profile not found.', 'PROFILE_NOT_FOUND');
  return success(toPublicProfile(profile));
});

/** Mirrors prevent_protected_profile_updates(): only full_name/phone are writable by the user themselves. */
export const PATCH = withApi(
  async (req) => {
    const user = await requireUser();
    const body = await req.json();

    const set: Record<string, any> = {};
    const fullName = optionalString(body.full_name, 'full_name', 120);
    if (fullName !== null) set.fullName = fullName;
    const phone = optionalString(body.phone, 'phone', 20);
    if (phone !== null) set.phone = phone;

    await connectMongo();
    const profile = await Profile.findByIdAndUpdate(user.id, { $set: set }, { new: true });
    if (!profile) throw ApiError.notFound('Profile not found.', 'PROFILE_NOT_FOUND');

    return success(toPublicProfile(profile), 'Profile updated.');
  },
  { rateLimit: { scope: 'profile-update', max: 30 } }
);
