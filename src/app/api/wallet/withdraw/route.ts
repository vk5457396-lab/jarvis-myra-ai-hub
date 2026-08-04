export const runtime = 'nodejs';
export const maxDuration = 30;

import mongoose from 'mongoose';
import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireUser } from '../../_lib/middleware/user';
import { success, ApiError } from '../../_lib/utils/response';
import { requireString, validatePositiveInt } from '../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { Profile, Withdrawal } from '@/lib/db/models';

export const OPTIONS = handleOptions(['POST']);

/** Mirrors request_withdrawal(): balance check → deduct → insert, all-or-nothing. */
export const POST = withApi(
  async (req) => {
    const user = await requireUser();

    const body = await req.json();
    const amount = validatePositiveInt(body.amount, 'amount', 500);
    const upiId = requireString(body.upi_id, 'upi_id', { min: 3, max: 128 });

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

        const [withdrawal] = await Withdrawal.create([{ userId: user.id, amount, upiId, status: 'pending' }], {
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
