export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireAdmin } from '../../_lib/middleware/admin';
import { success } from '../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { Profile, ReferralEarning, Withdrawal } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

/** Admin dashboard data: all users, all referral earnings, all withdrawals. */
export const GET = withApi(async (req) => {
  await requireAdmin(req);
  await connectMongo();

  const [users, earnings, withdrawals] = await Promise.all([
    Profile.find().sort({ createdAt: -1 }).lean(),
    ReferralEarning.find().sort({ createdAt: -1 }).lean(),
    Withdrawal.find().sort({ createdAt: -1 }).lean(),
  ]);

  return success({
    users: users.map((u: any) => ({
      id: u._id.toString(),
      full_name: u.fullName,
      email: u.email,
      wallet_balance: u.walletBalance,
      referral_code: u.referralCode,
      created_at: u.createdAt,
    })),
    earnings: earnings.map((e: any) => ({
      id: e._id.toString(),
      referrer_id: e.referrerId?.toString(),
      referred_user_id: e.referredUserId?.toString(),
      purchase_amount: e.purchaseAmount,
      commission_amount: e.commissionAmount,
      status: e.status,
      created_at: e.createdAt,
    })),
    withdrawals: withdrawals.map((w: any) => ({
      id: w._id.toString(),
      user_id: w.userId?.toString(),
      amount: w.amount,
      upi_id: w.upiId,
      status: w.status,
      created_at: w.createdAt,
      processed_at: w.processedAt,
    })),
  });
});
