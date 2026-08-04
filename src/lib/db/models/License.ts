import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const licenseSchema = new Schema(
  {
    licenseKey: { type: String, required: true, unique: true },
    plan: { type: String, default: 'lifetime' },
    duration: { type: Number, default: null }, // days; null = lifetime
    status: { type: String, default: 'available', index: true }, // available | activated | expired | disabled
    deviceId: { type: String, default: null, index: true },
    activatedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    activationToken: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Profile', default: null },
  },
  { timestamps: true }
);

licenseSchema.index({ createdAt: -1 });

export type LicenseDoc = InferSchemaType<typeof licenseSchema>;

export const License: Model<LicenseDoc> = models.License || model<LicenseDoc>('License', licenseSchema);
