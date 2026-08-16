import { connectMongo } from '@/lib/db/mongoose';
import {
  User,
  Profile,
  MyraProfile,
  MyraSubscription,
  MyraAccessKey,
  MyraDevice,
  MyraAutomationError,
  MyraTelemetryEvent,
  MyraBlockedDevice,
  MyraBanner,
  MyraGlobalSettings,
} from '@/lib/db/models';
import { generateUniqueKeys } from '@/lib/licenses';
import { ApiError } from '../utils/response';
import { ensureMyraState, MYRA_PLANS } from './myraService';
import { listConnectorIds } from './connectors/registry';

const ACCESS_KEY_PREFIX = 'MYRA-PLAN';
const GLOBAL_SETTINGS_ID = 'singleton';

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
  const profile = await MyraProfile.findOneAndUpdate({ userId: user._id }, update, { new: true });
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

/** Admin: set (or clear, with 0) a per-user coupon-style discount %, by email. Applied
 *  automatically the next time this user creates/verifies a subscription order - see
 *  discountedPrice() in myraService.ts and its use in the order/verify routes. */
export async function setDiscountPercent({ user, discountPercent }: { user: any; discountPercent: number }) {
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw ApiError.badRequest('discount_percent must be between 0 and 100.', 'INVALID_DISCOUNT');
  }
  await connectMongo();
  return MyraProfile.findOneAndUpdate(
    { userId: user._id },
    { $set: { discountPercent } },
    { new: true }
  );
}

/** Admin: set (or clear, with 0) the sitewide "apply to all users" discount %. Combines with
 *  any individual user's coupon via effectiveDiscountPercent() (myraService.ts) - the higher of
 *  the two applies, on the next order/verify call or profile/bootstrap fetch for every user,
 *  with no per-user changes needed. */
export async function setGlobalDiscount({ discountPercent }: { discountPercent: number }) {
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw ApiError.badRequest('discount_percent must be between 0 and 100.', 'INVALID_DISCOUNT');
  }
  await connectMongo();
  return MyraGlobalSettings.findByIdAndUpdate(
    GLOBAL_SETTINGS_ID,
    { $set: { discountPercent } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

/**
 * Admin: clear EVERY discount at once - the sitewide one and every individual user's coupon -
 * back to 0%. The two other functions above only ever touch one target (one user, or the single
 * global value); this exists because zeroing just the global one still leaves any per-user
 * coupons in effect (effectiveDiscountPercent takes the higher of the two), so getting back to
 * "nobody has a discount" previously meant hunting down and clearing each user by hand.
 * @returns how many user records actually had a non-zero discount cleared.
 */
/**
 * Admin kill switch: enable/disable one connector for every user at once, no redeploy needed.
 * Blocks new connects immediately (createConnectSession) and existing connections' next
 * refresh/execute (getValidAccessToken) - see connectorService.ts. Does not revoke already-
 * issued tokens or touch UserConnection records; re-enabling picks up exactly where it left off.
 */
export async function setConnectorEnabled({
  connectorId,
  enabled,
}: {
  connectorId: string;
  enabled: boolean;
}) {
  if (!listConnectorIds().includes(connectorId)) {
    throw ApiError.badRequest('Unknown connector.', 'CONNECTOR_NOT_FOUND', { field: 'connectorId' });
  }
  await connectMongo();
  const settings = await MyraGlobalSettings.findByIdAndUpdate(
    GLOBAL_SETTINGS_ID,
    enabled
      ? { $pull: { disabledConnectors: connectorId } }
      : { $addToSet: { disabledConnectors: connectorId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return { disabledConnectors: (settings.disabledConnectors || []) as string[] };
}

export async function resetAllDiscounts(): Promise<{ usersCleared: number }> {
  await connectMongo();
  const [profileResult] = await Promise.all([
    MyraProfile.updateMany({ discountPercent: { $gt: 0 } }, { $set: { discountPercent: 0 } }),
    MyraGlobalSettings.findByIdAndUpdate(
      GLOBAL_SETTINGS_ID,
      { $set: { discountPercent: 0 } },
      { upsert: true, setDefaultsOnInsert: true }
    ),
  ]);
  return { usersCleared: profileResult.modifiedCount };
}

/** Admin: grant/revoke eligibility for the Custom Name add-on, by email. Revoking does NOT
 *  clear the name already on file - it just stops it applying (see
 *  ConversationalAgentService's identity prompt) and re-enabling restores it instantly. */
export async function setCustomNameEligibility({ user, enabled }: { user: any; enabled: boolean }) {
  await connectMongo();
  return MyraProfile.findOneAndUpdate(
    { userId: user._id },
    { $set: { customNameEnabled: enabled } },
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

/** How recently a heartbeat must have landed for a device to still count as "online" - past
 *  this, treat it as gone rather than trusting a stale stored state that nothing will ever
 *  flip back on its own (app killed, phone off, network gone). */
const LIVE_DEVICE_ONLINE_WINDOW_MS = 90_000;

/** Admin > Live Devices: every device with at least one heartbeat on record, most recently
 *  active first, with the owning user's email joined in - see MyraDevice's heartbeat fields
 *  (Myra.ts) for what upsertHeartbeat actually writes. "online" is computed here from
 *  lastHeartbeatAt's recency, never read from a stored flag. */
export async function listLiveDevices(limit = 200) {
  await connectMongo();
  const devices = await MyraDevice.find({ lastHeartbeatAt: { $ne: null } })
    .sort({ lastHeartbeatAt: -1 })
    .limit(limit)
    .populate('userId', 'email')
    .lean();

  const cutoff = Date.now() - LIVE_DEVICE_ONLINE_WINDOW_MS;
  return devices.map((d: any) => ({
    device_id: d.deviceId,
    device_name: d.deviceName,
    user_email: d.userId?.email ?? null,
    app_version: d.appVersion,
    app_state: d.appState,
    battery_percent: d.batteryPercent,
    network_type: d.networkType,
    current_task: d.currentTask,
    current_screen_app: d.currentScreenApp,
    gemini_live_connected: d.geminiLiveConnected,
    reconnect_count: d.reconnectCount,
    last_heartbeat_at: d.lastHeartbeatAt,
    online: d.lastHeartbeatAt ? new Date(d.lastHeartbeatAt).getTime() >= cutoff : false,
  }));
}

/** Admin > Diagnostics: recent automation failures, newest first, with the owning user's email
 *  joined in. See MyraAutomationError's schema doc comment (Myra.ts) for what gets logged here
 *  and why. */
export async function listAutomationErrors({
  limit = 100,
  failureType,
}: { limit?: number; failureType?: string } = {}) {
  await connectMongo();
  const filter: Record<string, any> = {};
  if (failureType) filter.failureType = failureType;

  const errors = await MyraAutomationError.find(filter)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'email')
    .lean();

  return errors.map((e: any) => ({
    id: e._id.toString(),
    user_email: e.userId?.email ?? null,
    device_id: e.deviceId,
    failure_type: e.failureType,
    task_description: e.taskDescription,
    tool_name: e.toolName,
    error_message: e.errorMessage,
    app_version: e.appVersion,
    context: e.context,
    timestamp: e.timestamp,
  }));
}

/** Admin > Analytics: aggregate counters for the dashboard - user/device totals, plan mix, and
 *  automation health (failure volume + breakdown) over the last 24h/7d/14d. Every number here is
 *  computed fresh from the same collections the other admin pages already read (MyraDevice,
 *  MyraAutomationError, MyraProfile) - nothing new is written or tracked to produce this. */
export async function getAnalyticsSummary() {
  await connectMongo();

  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60 * 1000);
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const since14d = new Date(now - 14 * 24 * 60 * 60 * 1000);
  const onlineCutoff = new Date(now - LIVE_DEVICE_ONLINE_WINDOW_MS);

  const [
    totalUsers,
    totalDevices,
    onlineDevices,
    geminiLiveConnectedDevices,
    errors24h,
    errors7d,
    byTypeRaw,
    dailyTrendRaw,
    plansRaw,
    topAffectedUsersRaw,
  ] = await Promise.all([
    User.countDocuments(),
    MyraDevice.countDocuments(),
    MyraDevice.countDocuments({ lastHeartbeatAt: { $gte: onlineCutoff } }),
    MyraDevice.countDocuments({ lastHeartbeatAt: { $gte: onlineCutoff }, geminiLiveConnected: true }),
    MyraAutomationError.countDocuments({ timestamp: { $gte: since24h } }),
    MyraAutomationError.countDocuments({ timestamp: { $gte: since7d } }),
    MyraAutomationError.aggregate([
      { $match: { timestamp: { $gte: since7d } } },
      { $group: { _id: '$failureType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    MyraAutomationError.aggregate([
      { $match: { timestamp: { $gte: since14d } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    MyraProfile.aggregate([
      { $group: { _id: '$subscriptionType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    MyraAutomationError.aggregate([
      { $match: { timestamp: { $gte: since7d } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const topAffectedUsers = await User.populate(topAffectedUsersRaw, { path: '_id', select: 'email' });

  return {
    users: { total: totalUsers },
    devices: {
      total: totalDevices,
      online_now: onlineDevices,
      gemini_live_connected_now: geminiLiveConnectedDevices,
    },
    automation: {
      errors_24h: errors24h,
      errors_7d: errors7d,
      by_type_7d: byTypeRaw.map((r: any) => ({ failure_type: r._id, count: r.count })),
      daily_trend_14d: dailyTrendRaw.map((r: any) => ({ date: r._id, count: r.count })),
      top_affected_users_7d: topAffectedUsers.map((r: any) => ({
        user_email: r._id?.email ?? null,
        count: r.count,
      })),
    },
    plans: plansRaw.map((r: any) => ({ plan: r._id || 'free', count: r.count })),
  };
}

/** Admin > Performance: tool-call volume/latency/failure rate per tool, the most recent tool
 *  failures with their full error text, and voice-response latency (PROCESSING -> SPEAKING, see
 *  MyraStateManager) over 24h/7d plus a 14-day daily trend. All computed from MyraTelemetryEvent
 *  - see that schema's doc comment for exactly what gets logged and from where. */
export async function getPerformanceSummary() {
  await connectMongo();

  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60 * 1000);
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const since14d = new Date(now - 14 * 24 * 60 * 60 * 1000);

  const [toolStatsRaw, recentToolFailuresRaw, latency24hRaw, latency7dRaw, latencyTrendRaw] = await Promise.all([
    MyraTelemetryEvent.aggregate([
      { $match: { type: 'tool_call', timestamp: { $gte: since7d } } },
      {
        $group: {
          _id: '$toolName',
          calls: { $sum: 1 },
          failures: { $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] } },
          avgDurationMs: { $avg: '$durationMs' },
          maxDurationMs: { $max: '$durationMs' },
        },
      },
      { $sort: { calls: -1 } },
    ]),
    MyraTelemetryEvent.find({ type: 'tool_call', success: false, timestamp: { $gte: since7d } })
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('userId', 'email')
      .lean(),
    MyraTelemetryEvent.aggregate([
      { $match: { type: 'response_latency', timestamp: { $gte: since24h } } },
      { $group: { _id: null, avg: { $avg: '$durationMs' }, max: { $max: '$durationMs' }, count: { $sum: 1 } } },
    ]),
    MyraTelemetryEvent.aggregate([
      { $match: { type: 'response_latency', timestamp: { $gte: since7d } } },
      { $group: { _id: null, avg: { $avg: '$durationMs' }, max: { $max: '$durationMs' }, count: { $sum: 1 } } },
    ]),
    MyraTelemetryEvent.aggregate([
      { $match: { type: 'response_latency', timestamp: { $gte: since14d } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          avg: { $avg: '$durationMs' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const latencySummary = (rows: any[]) =>
    rows[0]
      ? { avg_ms: Math.round(rows[0].avg), max_ms: rows[0].max, count: rows[0].count }
      : { avg_ms: null, max_ms: null, count: 0 };

  return {
    tool_stats_7d: toolStatsRaw.map((t: any) => ({
      tool_name: t._id || 'Unknown',
      calls: t.calls,
      failures: t.failures,
      success_rate_pct: t.calls > 0 ? Math.round(((t.calls - t.failures) / t.calls) * 1000) / 10 : null,
      avg_duration_ms: Math.round(t.avgDurationMs),
      max_duration_ms: t.maxDurationMs,
    })),
    recent_tool_failures: recentToolFailuresRaw.map((e: any) => ({
      id: e._id.toString(),
      user_email: e.userId?.email ?? null,
      device_id: e.deviceId,
      tool_name: e.toolName,
      duration_ms: e.durationMs,
      error_message: e.errorMessage,
      app_version: e.appVersion,
      timestamp: e.timestamp,
    })),
    response_latency: {
      last_24h: latencySummary(latency24hRaw),
      last_7d: latencySummary(latency7dRaw),
      daily_trend_14d: latencyTrendRaw.map((r: any) => ({ date: r._id, avg_ms: Math.round(r.avg), count: r.count })),
    },
  };
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

// ================================================================
// Event/promo banners (admin-authored popup shown on Android app open)
// ================================================================

export async function listBanners() {
  await connectMongo();
  return MyraBanner.find({}).sort({ createdAt: -1 }).lean();
}

export async function createBanner({
  title,
  message,
  imageUrl,
  ctaLabel,
  ctaUrl,
  createdBy,
}: {
  title: string;
  message: string;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  createdBy?: string | null;
}) {
  await connectMongo();
  return MyraBanner.create({
    title,
    message,
    imageUrl: imageUrl || null,
    ctaLabel: ctaLabel || null,
    ctaUrl: ctaUrl || null,
    isActive: false,
    createdBy: createdBy || null,
  });
}

export async function updateBanner(
  id: string,
  fields: Partial<{
    title: string;
    message: string;
    imageUrl: string | null;
    ctaLabel: string | null;
    ctaUrl: string | null;
    isActive: boolean;
  }>
) {
  await connectMongo();
  const banner = await MyraBanner.findByIdAndUpdate(id, { $set: fields }, { new: true });
  if (!banner) throw ApiError.notFound('Banner not found.', 'BANNER_NOT_FOUND');
  return banner;
}

export async function deleteBanner(id: string) {
  await connectMongo();
  const res = await MyraBanner.findByIdAndDelete(id);
  if (!res) throw ApiError.notFound('Banner not found.', 'BANNER_NOT_FOUND');
}

/** Whichever banner is currently switched on - manual on/off, not date-range scheduled (see
 *  the schema comment on isActive). If more than one is accidentally left active, the most
 *  recently updated one wins rather than an arbitrary DB order. */
export async function getActiveBanner() {
  await connectMongo();
  return MyraBanner.findOne({ isActive: true }).sort({ updatedAt: -1 });
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
