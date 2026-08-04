import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const withdrawalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
    amount: { type: Number, required: true, min: 1, max: 500 },
    upiId: { type: String, required: true },
    status: { type: String, default: 'pending' },
    processedBy: { type: Schema.Types.ObjectId, ref: 'Profile', default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type WithdrawalDoc = InferSchemaType<typeof withdrawalSchema>;

export const Withdrawal: Model<WithdrawalDoc> =
  models.Withdrawal || model<WithdrawalDoc>('Withdrawal', withdrawalSchema);
