import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const referralEarningSchema = new Schema(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
    referredUserId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
    purchaseId: { type: String, required: true },
    purchaseAmount: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    status: { type: String, default: 'credited' },
  },
  { timestamps: true }
);

// Mirrors credit_referral_wallet()'s idempotency guard — prevents double-crediting
// the same purchase to the same referrer on retries.
referralEarningSchema.index({ purchaseId: 1, referrerId: 1 }, { unique: true });

export type ReferralEarningDoc = InferSchemaType<typeof referralEarningSchema>;

export const ReferralEarning: Model<ReferralEarningDoc> =
  models.ReferralEarning || model<ReferralEarningDoc>('ReferralEarning', referralEarningSchema);
