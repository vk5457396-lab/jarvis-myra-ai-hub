import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

// Singleton document — always fetched/updated by the fixed _id below.
export const LICENSE_SETTINGS_ID = 'singleton';

const licenseSettingsSchema = new Schema(
  {
    _id: { type: String, default: LICENSE_SETTINGS_ID },
    prefix: { type: String, default: 'MYRA' },
    randomLength: { type: Number, default: 16 },
    maxActivations: { type: Number, default: 1 },
    deviceLock: { type: Boolean, default: true },
    offlineActivation: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type LicenseSettingsDoc = InferSchemaType<typeof licenseSettingsSchema>;

export const LicenseSettings: Model<LicenseSettingsDoc> =
  models.LicenseSettings || model<LicenseSettingsDoc>('LicenseSettings', licenseSettingsSchema);
