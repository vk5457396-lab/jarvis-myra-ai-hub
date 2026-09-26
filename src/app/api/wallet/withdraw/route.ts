export const runtime = 'nodejs';
export const maxDuration = 30;

import mongoose from 'mongoose';
import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireUser } from '../../_lib/middleware/user';
import { success, ApiError } from '../../_lib/utils/response';
import { requireString, validateEnum, validatePositiveInt } from '../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { Profile, Withdrawal, MIN_WITHDRAWAL_AMOUNT } from '@/lib/db/models';

export const OPTIONS = handleOptions(['POST']);

/** Mirrors request_withdrawal(): balance check → deduct → insert, all-or-nothing. */
export const POST = withApi(
  async (req) => {
    const user = await requireUser();

    const body = await req.json();
    const amount = validatePositiveInt(body.amount, 'amount', 1_000_000);
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      throw ApiError.badRequest(`Minimum withdrawal is ₹${MIN_WITHDRAWAL_AMOUNT}.`, 'WITHDRAWAL_BELOW_MINIMUM');
    }

    const method = validateEnum(body.method, 'method', ['upi', 'bank'], 'upi');
    const payout: Record<string, string> = { method };
    if (method === 'upi') {
      const upiId = requireString(body.upi_id, 'upi_id', { min: 3, max: 128 });
      if (!/^[\w.-]{2,}@[a-zA-Z][\w.-]*$/.test(upiId)) {
        throw ApiError.badRequest('Enter a valid UPI ID (e.g. name@upi).', 'INVALID_UPI_ID');
      }
      payout.upiId = upiId;
    } else {
      payout.bankAccountName = requireString(body.bank_account_name, 'bank_account_name', { min: 2, max: 120 });
      const accountNumber = String(body.bank_account_number ?? '').replace(/\s+/g, '');
      if (!/^\d{9,18}$/.test(accountNumber)) {
        throw ApiError.badRequest('Enter a valid bank account number (9–18 digits).', 'INVALID_BANK_ACCOUNT');
      }
      const ifsc = String(body.bank_ifsc ?? '').trim().toUpperCase();
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
        throw ApiError.badRequest('Enter a valid IFSC code (e.g. SBIN0001234).', 'INVALID_IFSC');
      }
      payout.bankAccountNumber = accountNumber;
      payout.bankIfsc = ifsc;
    }

    await connectMongo();

    let withdrawalId: string;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const updated = await Profile.findOneAndUpdate(
          { _id: user.id, walletBalance: { $gte: amount } },
          { $inc: { walletBalance: -amount } },
          { new: true, session }
        );

        if (!updated) {
          const profile = await Profile.findById(user.id).session(session);
          if (!profile) throw ApiError.notFound('Profile not found.', 'PROFILE_NOT_FOUND');
          throw ApiError.badRequest('Insufficient balance.', 'INSUFFICIENT_BALANCE');
        }

        const [withdrawal] = await Withdrawal.create([{ userId: user.id, amount, ...payout, status: 'pending' }], {
          session,
        });
        withdrawalId = withdrawal._id.toString();
      });
    } finally {
      await session.endSession();
    }

    return success({ withdrawal_id: withdrawalId! }, 'Withdrawal request submitted.', 201);
  },
  { rateLimit: { scope: 'wallet-withdraw', max: 10 } }
);
