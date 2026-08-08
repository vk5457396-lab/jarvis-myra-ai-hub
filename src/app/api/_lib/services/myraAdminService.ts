import { connectMongo } from '@/lib/db/mongoose';
import { User, Profile, MyraProfile, MyraSubscription, MyraAccessKey } from '@/lib/db/models';
import { generateUniqueKeys } from '@/lib/licenses';
import { ApiError } from '../utils/response';
import { ensureMyraState, MYRA_PLANS } from './myraService';

const ACCESS_KEY_PREFIX = 'MYRA-PLAN';

export async function findUserByEmail(email: string) {
  await connectMongo();
  const normalized = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalized });
  if (!user) {
    throw ApiError.notFound(
      'No account with that email. The person must sign up on the website or app first.',
      'USER_NOT_FOUND'
    );
  }
  const websiteProfile = await Profile.findOne({ email: user.email });
  return { user, websiteProfile };
}

export async function applyPlanToUser({
  user,
  websiteProfile,
  plan,
  durationDays,
  credits,
}: {
  user: any;
  websiteProfile: any;
  plan: string;
  durationDays?: number | null;
  credits?: number | null;
}) {
  const planDef = MYRA_PLANS[plan];
  if (!planDef) {
    throw ApiError.badRequest(`plan must be one of: ${Object.keys(MYRA_PLANS).join(', ')}.`, 'INVALID_PLAN');
  }
  await ensureMyraState(user, websiteProfile);

  const now = new Date();
  const days = durationDays === undefined ? planDef.durationDays : durationDays;
  const expiry = days ? new Date(now.getTime() + days * 24 * 60 * 60 * 1000) : null;
  const finalCredits = credits === undefined ? planDef.credits : credits;

  const profileSet: Record<string, any> = {
    subscriptionType: plan,
    subscriptionStatus: 'active',
    subscriptionExpiry: expiry,
    premiumFeatures: planDef.features,
  };
  if (finalCredits !== null && finalCredits !== undefined) profileSet.credits = finalCredits;

  const [profile, subscription] = await Promise.all([
    MyraProfile.findOneAndUpdate({ userId: user._id }, { $set: profileSet }, { new: true }),
    MyraSubscription.findOneAndUpdate(
      { userId: user._id },
      { $set: { plan, startDate: now, expiryDate: expiry, status: 'active' } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ),
  ]);

  return { profile, subscription };
}

export async function addCreditsToUser({
  user,
  websiteProfile,
  amount,
  mode,
}: {
  user: any;
  websiteProfile: any;
  amount: number;
  mode: 'add' | 'set';
}) {
  await ensureMyraState(user, websiteProfile);
  const update = mode === 'add' ? { $inc: { credits: amount } } : { $set: { credits: amount } };
  let profile = await MyraProfile.findOneAndUpdate({ userId: user._id }, update, { new: true });
  if (profile && profile.credits < 0) {
    profile.credits = 0;
    await profile.save();
  }
  return profile;
}

export async function generateMyraAccessKeys({
  plan,
  count,
  durationDays,
  credits,
  note,
  createdBy,
}: {
  plan: string;
  count: number;
  durationDays?: number | null;
  credits?: number | null;
  note?: string | null;
  createdBy?: string | null;
}) {
  if (!MYRA_PLANS[plan]) {
    throw ApiError.badRequest(`plan must be one of: ${Object.keys(MYRA_PLANS).join(', ')}.`, 'INVALID_PLAN');
  }
  await connectMongo();
  const existing = await MyraAccessKey.find({}, { key: 1 }).lean();
  const taken = new Set(existing.map((k: any) => k.key as string));
  const keys = generateUniqueKeys(count, ACCESS_KEY_PREFIX, 16, taken);

  return MyraAccessKey.insertMany(
    keys.map((key) => ({
      key,
      plan,
      durationDays: durationDays ?? null,
      credits: credits ?? null,
      note: note || null,
      createdBy: createdBy || null,
    }))
  );
}

export async function redeemMyraAccessKey({
  user,
  websiteProfile,
  key,
}: {
  user: any;
  websiteProfile: any;
  key: string;
}) {
  await connectMongo();
  const normalizedKey = key.trim().toUpperCase();

  // Atomic claim: only one caller can flip an "available" key to "redeemed".
  const record = await MyraAccessKey.findOneAndUpdate(
    { key: normalizedKey, status: 'available' },
    { $set: { status: 'redeemed', redeemedBy: user._id, redeemedAt: new Date() } },
    { new: true }
  );
  if (!record) {
    const existing = await MyraAccessKey.findOne({ key: normalizedKey });
    if (!existing) throw ApiError.notFound('Access key not found.', 'ACCESS_KEY_NOT_FOUND');
    throw ApiError.conflict('This access key has already been used or disabled.', 'ACCESS_KEY_ALREADY_USED');
  }

  try {
    const { profile, subscription } = await applyPlanToUser({
      user,
      websiteProfile,
      plan: record.plan,
      durationDays: record.durationDays,
      credits: record.credits,
    });
    return { profile, subscription, key: record };
  } catch (error) {
    // Applying the plan failed after the key was claimed — release it so it isn't burned for nothing.
    await MyraAccessKey.updateOne(
      { _id: record._id },
      { $set: { status: 'available', redeemedBy: null, redeemedAt: null } }
    );
    throw error;
  }
}
