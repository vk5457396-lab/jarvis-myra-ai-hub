export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success } from '../../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { User, Profile, MyraProfile, MyraSubscription, MyraUsage } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

/** Admin: search MYRA users by email and see their plan/credits/usage at a glance. */
export const GET = withApi(async (req) => {
  await requireAdmin(req);
  await connectMongo();

  const q = new URL(req.url).searchParams.get('q')?.trim().toLowerCase() || '';
  const filter = q
    ? { email: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
    : {};

  const users = await User.find(filter).sort({ createdAt: -1 }).limit(50).lean();
  const userIds = users.map((u: any) => u._id);
  const emails = users.map((u: any) => u.email);

  const [profiles, subscriptions, usages, websiteProfiles] = await Promise.all([
    MyraProfile.find({ userId: { $in: userIds } }).lean(),
    MyraSubscription.find({ userId: { $in: userIds } }).lean(),
    MyraUsage.find({ userId: { $in: userIds } }).lean(),
    Profile.find({ email: { $in: emails } }).lean(),
  ]);

  const profileByUser = new Map(profiles.map((p: any) => [p.userId.toString(), p]));
  const subByUser = new Map(subscriptions.map((s: any) => [s.userId.toString(), s]));
  const usageByUser = new Map(usages.map((u: any) => [u.userId.toString(), u]));
  const roleByEmail = new Map(websiteProfiles.map((p: any) => [p.email, p.role]));

  return success({
    users: users.map((u: any) => {
      const id = u._id.toString();
      const profile: any = profileByUser.get(id);
      const subscription: any = subByUser.get(id);
      const usage: any = usageByUser.get(id);
      return {
        id,
        email: u.email,
        name: u.name,
        role: roleByEmail.get(u.email) || 'user',
        created_at: u.createdAt,
        myra_username: profile?.username ?? null,
        credits: profile?.credits ?? null,
        subscription_type: profile?.subscriptionType ?? null,
        subscription_status: profile?.subscriptionStatus ?? null,
        subscription_expiry: profile?.subscriptionExpiry ?? null,
        badge_override: profile?.badgeOverride ?? null,
        is_admin: Boolean(profile?.isAdmin),
        plan: subscription?.plan ?? null,
        plan_status: subscription?.status ?? null,
        credits_used: usage?.creditsUsed ?? null,
      };
    }),
  });
});
