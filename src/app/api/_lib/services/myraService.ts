import { connectMongo } from '@/lib/db/mongoose';
import {
  MyraDevice,
  MyraProfile,
  MyraSettings,
  MyraSubscription,
  MyraUsage,
} from '@/lib/db/models';
import { isAdminEmail } from '@/lib/auth/users';
import { ensureMyraGroupMembership } from './myraGroupService';

export const MYRA_PLANS: Record<
  string,
  { price: number; credits: number | null; durationDays: number | null; features: string[] }
> = {
  free: { price: 0, credits: 10, durationDays: 1, features: [] },
  basic: { price: 299, credits: 50, durationDays: 30, features: ['standard_ai', 'basic_automation'] },
  premium: { price: 349, credits: 150, durationDays: 30, features: ['advanced_ai', 'smart_automation'] },
  elite: { price: 449, credits: 250, durationDays: 30, features: ['all_models', 'advanced_automation'] },
  elite_pro: { price: 559, credits: 500, durationDays: 30, features: ['early_access', 'pro_automation'] },
  membership: { price: 999, credits: null, durationDays: null, features: ['unlimited', 'all_models'] },
};

/** Rounds to the nearest rupee - Razorpay wants an integer amount in paise, and a fractional
 *  rupee from an odd discount % (e.g. 15% of Rs.299) would otherwise carry into the paise math. */
export function discountedPrice(basePrice: number, discountPercent: number): number {
  const clamped = Math.min(100, Math.max(0, discountPercent || 0));
  return Math.round(basePrice * (1 - clamped / 100));
}

export function expiryForPlan(plan: string, start = new Date()): Date | null {
  const days = MYRA_PLANS[plan]?.durationDays;
  if (!days) return null;
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}

const REFERRAL_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I - easy to read aloud
function generateReferralCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += REFERRAL_CODE_ALPHABET[Math.floor(Math.random() * REFERRAL_CODE_ALPHABET.length)];
  }
  return code;
}

/** Every profile gets a shareable referral code, generated lazily on first bootstrap after this
 *  field shipped (existing profiles won't have one from $setOnInsert, which only fires on
 *  document creation) rather than backfilled in a migration. Retries past the rare collision -
 *  the unique index on referralCode is the actual guarantee, this is just making the odds good. */
async function ensureReferralCode(profile: any) {
  if (profile.referralCode) return profile;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      profile.referralCode = generateReferralCode();
      await profile.save();
      return profile;
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      // Duplicate key on referralCode - another profile already has this code, try again.
    }
  }
  throw new Error('Could not generate a unique referral code after 5 attempts.');
}

export async function ensureMyraState(user: any, websiteProfile?: any) {
  await connectMongo();
  const userId = user._id;
  const now = new Date();
  const trialExpiry = expiryForPlan('free', now);
  const username = user.name || websiteProfile?.fullName || user.email?.split('@')[0] || 'User';
  const avatar = user.profilePhoto || user.image || null;
  const isAdmin = isAdminEmail(user.email || '');

  const [profile, subscription, usage, settings] = await Promise.all([
    MyraProfile.findOneAndUpdate(
      { userId },
      {
        // Refreshed on every call (not just insert) so a change to ADMIN_EMAILS takes effect
        // on the next login instead of being frozen at whatever it was on account creation.
        $set: { isAdmin },
        $setOnInsert: {
          userId,
          username,
          chatHandle: '',
          chatHandleLower: '',
          bio: '',
          avatar,
          language: 'en',
          voice: 'default',
          aiPersonality: 'Normal',
          credits: MYRA_PLANS.free.credits,
          subscriptionType: 'free',
          subscriptionStatus: 'active',
          subscriptionExpiry: trialExpiry,
          premiumFeatures: [],
          preferences: {},
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ),
    MyraSubscription.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          plan: 'free',
          startDate: now,
          expiryDate: trialExpiry,
          status: 'active',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ),
    MyraUsage.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, lastReset: now } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ),
    MyraSettings.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ),
  ]);

  await ensureReferralCode(profile);

  // Best-effort: the MYRA community group living in Firestore must never block login/bootstrap
  // if Firestore is briefly unreachable.
  try {
    await ensureMyraGroupMembership(
      userId.toString(),
      profile.chatHandle || username,
      profile.avatar,
      chatBadgeFields(profile)
    );
  } catch (error) {
    console.warn('[myraGroup] membership sync failed', (error as Error)?.message);
  }

  return { profile, subscription, usage, settings };
}

/**
 * Chat-facing admin/subscription badge, for display only (search, all-users directory,
 * conversation list/header) - NOT used for publicMyraProfile()/billing, since that must
 * always reflect the user's real plan regardless of a cosmetic badge override.
 * An admin-set badgeOverride takes priority over the computed isAdmin/subscriptionType badge;
 * 'none' explicitly suppresses any badge (including a real isAdmin/membership one).
 */
export function chatBadgeFields(profile: {
  isAdmin?: boolean;
  subscriptionType?: string | null;
  badgeOverride?: string | null;
}) {
  switch (profile.badgeOverride) {
    case 'red':
      return { is_admin: true, subscription_type: profile.subscriptionType ?? null };
    case 'blue':
      return { is_admin: false, subscription_type: 'membership' };
    case 'yellow':
      return { is_admin: false, subscription_type: 'premium' };
    case 'none':
      return { is_admin: false, subscription_type: null };
    default:
      return { is_admin: Boolean(profile.isAdmin), subscription_type: profile.subscriptionType ?? null };
  }
}

export function publicUser(user: any, role: 'admin' | 'user' = 'user') {
  return {
    id: user._id.toString(),
    name: user.name || null,
    email: user.email,
    profile_photo: user.profilePhoto || user.image || null,
    auth_provider: user.authProvider || null,
    role,
    created_at: user.createdAt || null,
    last_login: user.lastLogin || null,
  };
}

export function publicMyraProfile(profile: any) {
  // What chat should actually render for this user (badge override already resolved) - see
  // chatBadgeFields() above. The client needs this, not raw is_admin/subscription_type, when it
  // self-heals its own participantInfo entry on every message send (see sendMessage() in the
  // Android FirestoreChatRepository) - using the raw fields there was clobbering an admin-set
  // badge override the moment that user sent their next message, since the client write always
  // lands after the server's login-time chatBadgeFields()-aware sync.
  const chatBadge = chatBadgeFields(profile);
  return {
    id: profile._id.toString(),
    user_id: profile.userId.toString(),
    username: profile.username,
    chat_handle: profile.chatHandle || '',
    // True only once the user has claimed a unique @handle via /api/myra/username. Separate
    // from `username` above, which is auto-filled from their name/email on account creation,
    // is not unique, and is edited independently via PATCH /api/myra/profile.
    has_chat_handle: Boolean(profile.chatHandleLower),
    bio: profile.bio || '',
    is_admin: Boolean(profile.isAdmin),
    avatar: profile.avatar,
    language: profile.language,
    voice: profile.voice,
    ai_personality: profile.aiPersonality,
    credits: profile.credits,
    subscription_type: profile.subscriptionType,
    subscription_status: profile.subscriptionStatus,
    subscription_expiry: profile.subscriptionExpiry,
    premium_features: profile.premiumFeatures || [],
    preferences: profile.preferences || {},
    badge_override: profile.badgeOverride ?? null,
    chat_badge_is_admin: chatBadge.is_admin,
    chat_badge_subscription_type: chatBadge.subscription_type,
    referral_code: profile.referralCode ?? null,
    referred_by_code: profile.referredByCode ?? null,
    discount_percent: profile.discountPercent ?? 0,
    custom_name_enabled: Boolean(profile.customNameEnabled),
    custom_assistant_name: profile.customAssistantName ?? null,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  };
}

export function publicBanner(banner: any) {
  return {
    id: banner._id.toString(),
    title: banner.title,
    message: banner.message,
    image_url: banner.imageUrl ?? null,
    cta_label: banner.ctaLabel ?? null,
    cta_url: banner.ctaUrl ?? null,
    is_active: Boolean(banner.isActive),
    created_at: banner.createdAt,
    updated_at: banner.updatedAt,
  };
}

export function publicSubscription(subscription: any) {
  return {
    id: subscription._id.toString(),
    user_id: subscription.userId.toString(),
    plan: subscription.plan,
    start_date: subscription.startDate,
    expiry_date: subscription.expiryDate,
    payment_id: subscription.paymentId,
    status: subscription.status,
  };
}

export function publicUsage(usage: any) {
  return {
    credits_used: usage.creditsUsed,
    prompts_count: usage.promptsCount,
    voice_minutes: usage.voiceMinutes,
    image_generations: usage.imageGenerations,
    automation_count: usage.automationCount,
    last_reset: usage.lastReset,
  };
}

export function publicSettings(settings: any) {
  return {
    theme: settings.theme,
    notifications: settings.notifications,
    chat_notifications: settings.chatNotifications !== false,
    language: settings.language,
    assistant_voice: settings.assistantVoice,
    wake_word: settings.wakeWord,
    permissions: settings.permissions || {},
  };
}

export function publicDevice(device: any) {
  return {
    id: device._id.toString(),
    device_id: device.deviceId,
    device_name: device.deviceName,
    manufacturer: device.manufacturer,
    model: device.model,
    android_version: device.androidVersion,
    app_version: device.appVersion,
    last_login: device.lastLogin,
    push_token: device.pushToken,
    is_current_device: device.isCurrentDevice,
  };
}

export async function upsertMyraDevice(
  userId: any,
  device: Record<string, any>,
  refreshTokenHash?: string
) {
  const deviceId = String(device.device_id || '').trim();
  if (!deviceId) throw new Error('device_id is required');

  const set: Record<string, any> = {
    deviceName: device.device_name || null,
    manufacturer: device.manufacturer || null,
    model: device.model || null,
    androidVersion: device.android_version || null,
    appVersion: device.app_version || null,
    lastLogin: new Date(),
    isCurrentDevice: true,
  };
  if (device.push_token !== undefined) set.pushToken = device.push_token || null;
  if (refreshTokenHash) set.refreshTokenHash = refreshTokenHash;

  return MyraDevice.findOneAndUpdate(
    { userId, deviceId },
    { $set: set, $setOnInsert: { userId, deviceId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}
