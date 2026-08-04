export const runtime = 'nodejs';
export const maxDuration = 30;

import mongoose from 'mongoose';
import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { validateEnum } from '../../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { Profile, Withdrawal } from '@/lib/db/models';

export const OPTIONS = handleOptions(['PUT']);

/** Mirrors process_withdrawal(): admin approves/rejects, refunding the wallet on rejection. */
export const PUT = withApi(
  async (req) => {
    const admin = await requireAdmin(req);

    const id = req.nextUrl.pathname.split('/').pop()!;
    const body = await req.json();
    const status = validateEnum(body.status, 'status', ['completed', 'rejected'], undefined);

    await connectMongo();

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const withdrawal = await Withdrawal.findById(id).session(session);
        if (!withdrawal) throw ApiError.notFound('Withdrawal not found.', 'WITHDRAWAL_NOT_FOUND');
        if (withdrawal.status !== 'pending') {
          throw ApiError.conflict('Withdrawal already processed.', 'WITHDRAWAL_ALREADY_PROCESSED');
        }

        if (status === 'rejected') {
          await Profile.findByIdAndUpdate(withdrawal.userId, { $inc: { walletBalance: withdrawal.amount } }, { session });
        }

        withdrawal.status = status;
        withdrawal.processedBy = admin.userId as any;
        withdrawal.processedAt = new Date();
        await withdrawal.save({ session });
      });
    } finally {
      await session.endSession();
    }

    return success({}, 'Withdrawal updated.');
  },
  { rateLimit: { scope: 'admin-withdrawals', max: 60 } }
);
