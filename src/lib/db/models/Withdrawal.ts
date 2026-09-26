import { Schema, model, models, type Model, type InferSchemaType } from 'mongoose';

const withdrawalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    method: { type: String, enum: ['upi', 'bank'], default: 'upi' },
    upiId: { type: String, default: null },
    bankAccountName: { type: String, default: null },
    bankAccountNumber: { type: String, default: null },
    bankIfsc: { type: String, default: null },
    status: { type: String, default: 'pending' },
    processedBy: { type: Schema.Types.ObjectId, ref: 'Profile', default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const MIN_WITHDRAWAL_AMOUNT = 500;

/** Shape shared by the user wallet and admin APIs. `payout_to` is a one-line summary for lists. */
export function toPublicWithdrawal(w: any, { maskAccount = false } = {}) {
  const method = w.method === 'bank' ? 'bank' : 'upi';
  const acct: string | null = w.bankAccountNumber || null;
  const shownAcct = acct && maskAccount ? `XXXX${acct.slice(-4)}` : acct;
  return {
    id: w._id.toString(),
    user_id: w.userId?.toString(),
    amount: w.amount,
    method,
    upi_id: w.upiId || null,
    bank_account_name: w.bankAccountName || null,
    bank_account_number: shownAcct,
    bank_ifsc: w.bankIfsc || null,
    payout_to: method === 'bank' ? `${w.bankAccountName || ''} · A/C ${shownAcct} · ${w.bankIfsc || ''}` : w.upiId,
    status: w.status,
    created_at: w.createdAt,
    processed_at: w.processedAt,
  };
}

export type WithdrawalDoc = InferSchemaType<typeof withdrawalSchema>;

export const Withdrawal: Model<WithdrawalDoc> =
  models.Withdrawal || model<WithdrawalDoc>('Withdrawal', withdrawalSchema);
