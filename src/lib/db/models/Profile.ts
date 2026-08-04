import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const profileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, default: null },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: null },
    passwordHash: { type: String, default: null },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      default: () => Math.random().toString(36).slice(2, 10),
    },
    referredBy: { type: Schema.Types.ObjectId, ref: 'Profile', default: null },
    walletBalance: { type: Number, default: 0 },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    resetToken: { type: String, default: null },
    resetTokenExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export type ProfileDoc = InferSchemaType<typeof profileSchema>;

export const Profile: Model<ProfileDoc> = models.Profile || model<ProfileDoc>('Profile', profileSchema);
