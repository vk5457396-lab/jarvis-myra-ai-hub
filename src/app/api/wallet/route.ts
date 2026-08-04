export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../_lib/middleware/handler';
import { requireUser } from '../_lib/middleware/user';
import { success } from '../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { Profile, ReferralEarning, Withdrawal } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

/** Self-serve wallet summary for the dashboard: earnings, withdrawal history, referral count. */
export const GET = withApi(async () => {
  const user = await requireUser();
  await connectMongo();

  const [earnings, withdrawals, referralCount] = await Promise.all([
    ReferralEarning.find({ referrerId: user.id }).sort({ createdAt: -1 }).lean(),
    Withdrawal.find({ userId: user.id }).sort({ createdAt: -1 }).lean(),
    Profile.countDocuments({ referredBy: user.id }),
  ]);

  return success({
    earnings: earnings.map((e: any) => ({
      id: e._id.toString(),
      purchase_amount: e.purchaseAmount,
      commission_amount: e.commissionAmount,
      status: e.status,
      created_at: e.createdAt,
    })),
    withdrawals: withdrawals.map((w: any) => ({
      id: w._id.toString(),
      amount: w.amount,
      upi_id: w.upiId,
      status: w.status,
      created_at: w.createdAt,
      processed_at: w.processedAt,
    })),
    referral_count: referralCount,
  });
});
