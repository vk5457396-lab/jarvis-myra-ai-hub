import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const deviceSchema = new Schema(
  {
    deviceId: { type: String, required: true, unique: true },
    userId: { type: String, default: null, index: true },
    fcmToken: { type: String, default: null, index: true },
    appVersion: { type: String, default: null },
    androidVersion: { type: String, default: null },
    licenseKey: { type: String, default: null },
    plan: { type: String, default: null },
    lastSeenAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export type DeviceDoc = InferSchemaType<typeof deviceSchema>;

export const Device: Model<DeviceDoc> = models.Device || model<DeviceDoc>('Device', deviceSchema);
