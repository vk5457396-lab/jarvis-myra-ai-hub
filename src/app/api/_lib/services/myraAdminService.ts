import { connectMongo } from '@/lib/db/mongoose';
import {
  User,
  Profile,
  MyraProfile,
  MyraSubscription,
  MyraAccessKey,
  MyraDevice,
  MyraBlockedDevice,
} from '@/lib/db/models';
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

const BADGE_VALUES = ['blue', 'red', 'yellow', 'none'] as const;

/** Admin: manually set (or clear) a user's chat badge override, by email. */
export async function setBadgeOverride({
  user,
  badge,
}: {
  user: any;
  badge: (typeof BADGE_VALUES)[number] | null;
}) {
  if (badge !== null && !BADGE_VALUES.includes(badge)) {
    throw ApiError.badRequest(`badge must be one of: ${BADGE_VALUES.join(', ')}.`, 'INVALID_BADGE');
  }
  await connectMongo();
  return MyraProfile.findOneAndUpdate(
    { userId: user._id },
    { $set: { badgeOverride: badge } },
    { new: true }
  );
}

/** Admin: every device a user has ever logged in from, with each one's current block status. */
export async function listUserDevices(user: any) {
  await connectMongo();
  const devices = await MyraDevice.find({ userId: user._id }).sort({ lastLogin: -1 }).lean();
  if (devices.length === 0) return [];
  const blocked = await MyraBlockedDevice.find({
    deviceId: { $in: devices.map((d: any) => d.deviceId) },
  })
    .select('deviceId')
    .lean();
  const blockedSet = new Set(blocked.map((b: any) => b.deviceId));
  return devices.map((d: any) => ({
    device_id: d.deviceId,
    device_name: d.deviceName,
    manufacturer: d.manufacturer,
    model: d.model,
    android_version: d.androidVersion,
    app_version: d.appVersion,
    last_login: d.lastLogin,
    is_blocked: blockedSet.has(d.deviceId),
  }));
}

/** Admin: block a specific physical device (by its ANDROID_ID) from ever logging into any
 *  account - checked at login/refresh time in mobileAuthService. Idempotent. */
export async function blockDevice({
  deviceId,
  reason,
  blockedBy,
}: {
  deviceId: string;
  reason?: string | null;
  blockedBy?: string | null;
}) {
  await connectMongo();
  return MyraBlockedDevice.findOneAndUpdate(
    { deviceId },
    { $set: { reason: reason || null, blockedBy: blockedBy || null } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

export async function unblockDevice(deviceId: string) {
  await connectMongo();
  await MyraBlockedDevice.deleteOne({ deviceId });
}

/** Admin: free a device from the one-device-one-account lock (assertDeviceAccountLock in
 *  mobileAuthService) by deleting its MyraDevice binding - e.g. the user got a new phone and
 *  handed this one to someone else. The next login from this device (any account) rebinds it. */
export async function unlinkDevice(deviceId: string) {
  await connectMongo();
  await MyraDevice.deleteMany({ deviceId });
}

export async function generateMyraAccessKeys({
  plan,
  count,
  durationDays,
  credits,
  note,
  createdBy,
  assignedEmail,
  paymentId,
}: {
  plan: string;
  count: number;
  durationDays?: number | null;
  credits?: number | null;
  note?: string | null;
  createdBy?: string | null;
  assignedEmail?: string | null;
  paymentId?: string | null;
}) {
  if (!MYRA_PLANS[plan]) {
    throw ApiError.badRequest(`plan must be one of: ${Object.keys(MYRA_PLANS).join(', ')}.`, 'INVALID_PLAN');
  }
  const normalizedEmail = assignedEmail ? assignedEmail.trim().toLowerCase() : null;
  if (normalizedEmail && count > 1) {
    throw ApiError.badRequest('An email-assigned key can only be generated one at a time.', 'INVALID_COUNT');
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
      assignedEmail: normalizedEmail,
      // Omit rather than null - paymentId has a sparse unique index, and a sparse index
      // only skips documents where the field is absent, not ones where it's null.
      ...(paymentId ? { paymentId } : {}),
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
  const userEmail = user.email.toLowerCase();

  // Atomic claim: only one caller can flip an "available" key to "redeemed", and
  // an email-assigned key can only be claimed by that exact account.
  const record = await MyraAccessKey.findOneAndUpdate(
    {
      key: normalizedKey,
      status: 'available',
      $or: [{ assignedEmail: null }, { assignedEmail: userEmail }],
    },
    { $set: { status: 'redeemed', redeemedBy: user._id, redeemedAt: new Date() } },
    { new: true }
  );
  if (!record) {
    const existing = await MyraAccessKey.findOne({ key: normalizedKey });
    if (!existing) throw ApiError.notFound('Access key not found.', 'ACCESS_KEY_NOT_FOUND');
    if (existing.assignedEmail && existing.assignedEmail !== userEmail) {
      throw ApiError.forbidden(
        'This access key is assigned to a different account. Log in with the email it was issued to.',
        'ACCESS_KEY_WRONG_ACCOUNT'
      );
    }
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
