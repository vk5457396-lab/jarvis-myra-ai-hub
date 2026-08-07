import { connectMongo } from '@/lib/db/mongoose';
import {
  MyraDevice,
  MyraProfile,
  MyraSettings,
  MyraSubscription,
  MyraUsage,
} from '@/lib/db/models';

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

export function expiryForPlan(plan: string, start = new Date()): Date | null {
  const days = MYRA_PLANS[plan]?.durationDays;
  if (!days) return null;
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function ensureMyraState(user: any, websiteProfile?: any) {
  await connectMongo();
  const userId = user._id;
  const now = new Date();
  const trialExpiry = expiryForPlan('free', now);
  const username = user.name || websiteProfile?.fullName || user.email?.split('@')[0] || 'User';
  const avatar = user.profilePhoto || user.image || null;

  const [profile, subscription, usage, settings] = await Promise.all([
    MyraProfile.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          username,
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

  return { profile, subscription, usage, settings };
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
  return {
    id: profile._id.toString(),
    user_id: profile.userId.toString(),
    username: profile.username,
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
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
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
