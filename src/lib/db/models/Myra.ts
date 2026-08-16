import { Schema, model, models, type Model } from 'mongoose';

const objectId = Schema.Types.ObjectId;

const myraProfileSchema = new Schema(
  {
    userId: { type: objectId, ref: 'User', required: true, unique: true, index: true },
    // Free-text display name (not unique) - set from the account name at signup and editable
    // via the plain profile-edit screen. Deliberately NOT the same field as chatHandle below.
    username: { type: String, default: '' },
    // The unique @handle used for chat identity/search (WhatsApp/Telegram-style). Separate
    // from `username` on purpose: `username` is free text with no uniqueness constraint, so
    // reusing it here would let a later free-text profile edit silently steal/orphan someone's
    // chat handle without going through the availability check.
    chatHandle: { type: String, default: '' },
    // Lowercased mirror of chatHandle, kept in sync on every write. The unique index lives on
    // this field so uniqueness is case-insensitive (Vikash/vikash can't both be taken) while
    // chatHandle preserves the casing the user picked.
    chatHandleLower: { type: String, default: '' },
    bio: { type: String, default: '' },
    // Denormalized from ADMIN_EMAILS (see isAdminEmail()) and refreshed on every
    // ensureMyraState call, so chat badges don't need a User join on every read.
    isAdmin: { type: Boolean, default: false },
    avatar: { type: String, default: null },
    language: { type: String, default: 'en' },
    voice: { type: String, default: 'default' },
    aiPersonality: { type: String, default: 'Normal' },
    credits: { type: Number, default: 10, min: 0 },
    subscriptionType: { type: String, default: 'free' },
    subscriptionStatus: { type: String, default: 'active' },
    subscriptionExpiry: { type: Date, default: null },
    premiumFeatures: { type: [String], default: [] },
    preferences: { type: Schema.Types.Mixed, default: {} },
    // Admin-set chat badge, independent of the computed isAdmin/subscriptionType badge.
    // null/unset = use the computed badge as before. 'none' explicitly hides any badge
    // (including a real isAdmin/membership one) for this user.
    badgeOverride: { type: String, enum: ['blue', 'red', 'yellow', 'none', null], default: null },
    // This user's own shareable code (generated once, on first bootstrap - see ensureMyraState).
    referralCode: { type: String, default: null },
    // The code THIS user redeemed (once, ever) via POST /api/myra/referrals/redeem - null until
    // they redeem someone else's code. Distinct from referralCode, which is the code others use
    // to refer *this* user.
    referredByCode: { type: String, default: null },
    // Set true the moment the referrer has been credited for this user's first paid
    // subscription, so a later renewal (or a retried verify call) never double-credits them.
    referralCredited: { type: Boolean, default: false },
    // Admin-set, per-user coupon-style discount applied to THIS user's next order/verify call
    // for any plan (see order/route.ts + verify/route.ts) - never a blanket plan price change.
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    // Eligibility for the "Custom Name" add-on (Rs.1500 lifetime, admin-activated by email) -
    // once true, the user can set customAssistantName themselves via PATCH /api/myra/profile.
    // Independent of subscriptionType/MYRA_PLANS on purpose: this is an add-on, not a plan tier,
    // so buying/having it must never overwrite a user's actual AI plan.
    customNameEnabled: { type: Boolean, default: false },
    customAssistantName: { type: String, default: null },
  },
  { timestamps: true, collection: 'myra_profiles' }
);
myraProfileSchema.index(
  { chatHandleLower: 1 },
  { unique: true, partialFilterExpression: { chatHandleLower: { $type: 'string', $ne: '' } } }
);
myraProfileSchema.index(
  { referralCode: 1 },
  { unique: true, partialFilterExpression: { referralCode: { $type: 'string' } } }
);

const myraDeviceSchema = new Schema(
  {
    userId: { type: objectId, ref: 'User', required: true, index: true },
    deviceId: { type: String, required: true },
    deviceName: { type: String, default: null },
    manufacturer: { type: String, default: null },
    model: { type: String, default: null },
    androidVersion: { type: String, default: null },
    appVersion: { type: String, default: null },
    lastLogin: { type: Date, default: () => new Date() },
    pushToken: { type: String, default: null },
    isCurrentDevice: { type: Boolean, default: true },
    refreshTokenHash: { type: String, default: null, select: false },
    webHandoffHash: { type: String, select: false },

    // Live telemetry (Admin > Live Devices) - written by POST /api/myra/heartbeat, which the
    // app calls on its own state transitions plus a periodic safety-net timer. "Online" is
    // never stored directly - it's computed at read time from lastHeartbeatAt's recency (see
    // listLiveDevices in myraAdminService.ts), so a killed/crashed app can't get stuck showing
    // stale "online" with nothing to ever flip it back.
    appState: { type: String, default: null }, // Listening | Processing | Speaking | Idle
    batteryPercent: { type: Number, default: null },
    networkType: { type: String, default: null }, // wifi | cellular | offline | ...
    currentTask: { type: String, default: null },
    currentScreenApp: { type: String, default: null }, // foreground app/activity name
    geminiLiveConnected: { type: Boolean, default: null },
    reconnectCount: { type: Number, default: 0 }, // since the app process last cold-started
    lastHeartbeatAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'myra_devices' }
);
myraDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
// Non-unique - looked up on every login to enforce the one-device-one-account lock
// (assertDeviceAccountLock in mobileAuthService.ts), independent of which user it's for.
myraDeviceSchema.index({ deviceId: 1 });
myraDeviceSchema.index(
  { webHandoffHash: 1 },
  { unique: true, partialFilterExpression: { webHandoffHash: { $type: 'string' } } }
);

// Blocks a physical device (keyed only on deviceId, the Android ANDROID_ID) from ever logging
// into ANY account - independent of MyraDevice, which is scoped per-{userId, deviceId} and
// can't express "ban this device regardless of which account signs in on it". Checked in
// createMobileSession() (login) and the token-refresh route.
const myraBlockedDeviceSchema = new Schema(
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    reason: { type: String, default: null },
    blockedBy: { type: String, default: null },
  },
  { timestamps: true, collection: 'myra_blocked_devices' }
);

// Append-only log (Admin > Diagnostics) - one document per real automation failure: the agent
// ran out of steps, a tool reported an error, or MYRA claimed something succeeded that later
// turned out not to have (e.g. "playing" when isMusicActive() was a false positive). Written by
// POST /api/myra/automation-error, called by the app at the exact point each of these is
// already detected server-side-of-the-app (ActionExecutor, Agent, MissionExecutor) - this does
// not do any of its own failure detection, it just gives those existing checks somewhere to
// report to instead of only a local logcat line nobody but a developer with the phone in hand
// can see.
const myraAutomationErrorSchema = new Schema(
  {
    userId: { type: objectId, ref: 'User', required: true, index: true },
    deviceId: { type: String, default: null, index: true },
    // e.g. "max_steps_reached", "fake_success", "tool_error", "llm_failure" - open-ended on
    // purpose (new failure classes shouldn't need a schema migration), not an enum.
    failureType: { type: String, required: true, index: true },
    taskDescription: { type: String, default: null, maxlength: 2000 },
    toolName: { type: String, default: null },
    errorMessage: { type: String, default: null, maxlength: 4000 },
    appVersion: { type: String, default: null },
    // Free-form extra context (last screen summary, action history tail, etc.) - shape varies
    // by failureType, so Mixed rather than a fixed set of fields.
    context: { type: Schema.Types.Mixed, default: null },
    timestamp: { type: Date, default: () => new Date(), index: true },
  },
  { collection: 'myra_automation_errors' }
);
myraAutomationErrorSchema.index({ timestamp: -1 });

// Performance telemetry (Admin > Performance) - two event shapes share one collection since
// they're both "how is MYRA performing right now" facts logged from the same fire-and-forget
// TelemetryReporter pipeline as heartbeats/automation errors:
//  - type "tool_call": one per Action dispatched through ActionExecutor.execute() - toolName,
//    how long it took, and whether it succeeded (with the full error if not).
//  - type "response_latency": one per voice turn - how long MYRA spent between the user's turn
//    ending (PROCESSING) and MYRA actually starting to speak (SPEAKING), from MyraStateManager.
// High volume by design (every tool call, every turn) so this is TTL'd rather than kept forever
// like MyraAutomationError - 30 days is enough to spot a slow/failing tool or device without
// unbounded growth.
const myraTelemetryEventSchema = new Schema(
  {
    userId: { type: objectId, ref: 'User', required: true, index: true },
    deviceId: { type: String, default: null, index: true },
    type: { type: String, required: true, index: true }, // 'tool_call' | 'response_latency'
    toolName: { type: String, default: null, index: true },
    durationMs: { type: Number, required: true },
    success: { type: Boolean, default: null },
    errorMessage: { type: String, default: null, maxlength: 2000 },
    appVersion: { type: String, default: null },
    timestamp: { type: Date, default: () => new Date() },
  },
  { collection: 'myra_telemetry_events' }
);
myraTelemetryEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
myraTelemetryEventSchema.index({ type: 1, toolName: 1, timestamp: -1 });

const myraChatHistorySchema = new Schema(
  {
    userId: { type: objectId, ref: 'User', required: true, index: true },
    conversationId: { type: String, default: 'default', index: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    message: { type: String, required: true, maxlength: 20000 },
    messageType: { type: String, default: 'text' },
    inputMode: { type: String, default: 'text' },
    timestamp: { type: Date, default: () => new Date(), index: true },
  },
  { collection: 'myra_chat_history' }
);
myraChatHistorySchema.index({ userId: 1, timestamp: -1 });
myraChatHistorySchema.index({ userId: 1, conversationId: 1, timestamp: 1 });

const myraMemorySchema = new Schema(
  {
    userId: { type: objectId, ref: 'User', required: true, index: true },
    key: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    source: { type: String, default: 'android' },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { collection: 'myra_memory' }
);
myraMemorySchema.index({ userId: 1, key: 1 }, { unique: true });

const myraUsageSchema = new Schema(
  {
    userId: { type: objectId, ref: 'User', required: true, unique: true, index: true },
    creditsUsed: { type: Number, default: 0, min: 0 },
    promptsCount: { type: Number, default: 0, min: 0 },
    voiceMinutes: { type: Number, default: 0, min: 0 },
    imageGenerations: { type: Number, default: 0, min: 0 },
    automationCount: { type: Number, default: 0, min: 0 },
    lastReset: { type: Date, default: () => new Date() },
  },
  { timestamps: true, collection: 'myra_usage' }
);

const myraSubscriptionSchema = new Schema(
  {
    userId: { type: objectId, ref: 'User', required: true, unique: true, index: true },
    plan: { type: String, default: 'free' },
    startDate: { type: Date, default: () => new Date() },
    expiryDate: { type: Date, default: null },
    // No `default: null` here on purpose: a sparse unique index only skips documents
    // where the field is absent, not ones where it's explicitly null. Giving this a
    // default would make every free-plan upsert write `paymentId: null` and collide
    // on the unique index below after the first one.
    paymentId: { type: String },
    orderId: { type: String, default: null },
    status: { type: String, default: 'active' },
  },
  { timestamps: true, collection: 'myra_subscriptions' }
);
myraSubscriptionSchema.index({ paymentId: 1 }, { unique: true, sparse: true });

const myraSettingsSchema = new Schema(
  {
    userId: { type: objectId, ref: 'User', required: true, unique: true, index: true },
    theme: { type: String, default: 'black_amoled' },
    notifications: { type: Boolean, default: true },
    // Separate from `notifications` above (MYRA system/marketing pushes) - lets a user mute
    // chat message pushes without muting everything else, and vice versa.
    chatNotifications: { type: Boolean, default: true },
    language: { type: String, default: 'en' },
    assistantVoice: { type: String, default: 'default' },
    wakeWord: { type: String, default: 'MYRA' },
    permissions: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'myra_settings' }
);

const myraAccessKeySchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    plan: { type: String, required: true },
    credits: { type: Number, default: null },
    durationDays: { type: Number, default: null },
    status: { type: String, default: 'available', index: true }, // available | redeemed | disabled
    redeemedBy: { type: objectId, ref: 'User', default: null, index: true },
    redeemedAt: { type: Date, default: null },
    note: { type: String, default: null },
    createdBy: { type: String, default: null },
    // If set, only this email can redeem the key - e.g. issued for one specific purchase.
    assignedEmail: { type: String, default: null, index: true },
    // Razorpay payment_id that generated this key, when self-purchased on the website.
    // No `default: null` here either - see the same note on myraSubscriptionSchema.
    paymentId: { type: String },
  },
  { timestamps: true, collection: 'myra_access_keys' }
);
myraAccessKeySchema.index({ paymentId: 1 }, { unique: true, sparse: true });

// Promo/event popup shown once per app open on Android (e.g. Diwali, Independence Day) -
// admin-authored, simple manual on/off (isActive) rather than a date-range scheduler; only ever
// one banner is meant to be active at a time (see getActiveBanner in bannerService.ts), but
// nothing here enforces that at the DB level - it's an admin-panel convention.
const myraBannerSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    imageUrl: { type: String, default: null },
    ctaLabel: { type: String, default: null },
    ctaUrl: { type: String, default: null },
    isActive: { type: Boolean, default: false, index: true },
    createdBy: { type: String, default: null },
  },
  { timestamps: true, collection: 'myra_banners' }
);

// Singleton document (fixed _id) - the "apply to all users" half of the discount feature,
// separate from MyraProfile.discountPercent (the per-user coupon). Whichever is higher wins -
// see effectiveDiscountPercent() in myraService.ts - so a sitewide sale never undercuts a
// bigger coupon someone was already individually granted.
//
// disabledConnectors: admin-controlled kill switch, one connectorId (registry.ts's
// CONNECTOR_METADATA keys - "google", "google_drive", "youtube", "github", "canva") per disabled
// entry. Lets an admin instantly stop new connects/executes for one misbehaving integration
// without a redeploy - see connectorService.ts's createConnectSession/getValidAccessToken.
const myraGlobalSettingsSchema = new Schema(
  {
    _id: { type: String, default: 'singleton' },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    disabledConnectors: { type: [String], default: [] },
  },
  { timestamps: true, collection: 'myra_global_settings' }
);

export const MyraProfile: Model<any> =
  models.MyraProfile || model('MyraProfile', myraProfileSchema);
export const MyraGlobalSettings: Model<any> =
  models.MyraGlobalSettings || model('MyraGlobalSettings', myraGlobalSettingsSchema);
export const MyraDevice: Model<any> =
  models.MyraDevice || model('MyraDevice', myraDeviceSchema);
export const MyraAutomationError: Model<any> =
  models.MyraAutomationError || model('MyraAutomationError', myraAutomationErrorSchema);
export const MyraTelemetryEvent: Model<any> =
  models.MyraTelemetryEvent || model('MyraTelemetryEvent', myraTelemetryEventSchema);
export const MyraBlockedDevice: Model<any> =
  models.MyraBlockedDevice || model('MyraBlockedDevice', myraBlockedDeviceSchema);
export const MyraChatHistory: Model<any> =
  models.MyraChatHistory || model('MyraChatHistory', myraChatHistorySchema);
export const MyraMemory: Model<any> =
  models.MyraMemory || model('MyraMemory', myraMemorySchema);
export const MyraUsage: Model<any> =
  models.MyraUsage || model('MyraUsage', myraUsageSchema);
export const MyraSubscription: Model<any> =
  models.MyraSubscription || model('MyraSubscription', myraSubscriptionSchema);
export const MyraSettings: Model<any> =
  models.MyraSettings || model('MyraSettings', myraSettingsSchema);
export const MyraAccessKey: Model<any> =
  models.MyraAccessKey || model('MyraAccessKey', myraAccessKeySchema);
export const MyraBanner: Model<any> =
  models.MyraBanner || model('MyraBanner', myraBannerSchema);
