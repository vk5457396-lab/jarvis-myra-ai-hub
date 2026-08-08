import { Schema, model, models, type Model } from 'mongoose';

const objectId = Schema.Types.ObjectId;

const myraProfileSchema = new Schema(
  {
    userId: { type: objectId, ref: 'User', required: true, unique: true, index: true },
    username: { type: String, default: '' },
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
  },
  { timestamps: true, collection: 'myra_profiles' }
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
  },
  { timestamps: true, collection: 'myra_devices' }
);
myraDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
myraDeviceSchema.index(
  { webHandoffHash: 1 },
  { unique: true, partialFilterExpression: { webHandoffHash: { $type: 'string' } } }
);

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

export const MyraProfile: Model<any> =
  models.MyraProfile || model('MyraProfile', myraProfileSchema);
export const MyraDevice: Model<any> =
  models.MyraDevice || model('MyraDevice', myraDeviceSchema);
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
