export const runtime = 'nodejs';
export const maxDuration = 15;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import { success } from '../../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { MyraProfile } from '@/lib/db/models';
import { chatBadgeFields } from '../../../_lib/services/myraService';

export const OPTIONS = handleOptions(['GET']);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const GET = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const q = (new URL(req.url).searchParams.get('q') || '').trim();
    if (q.length < 2) return success({ users: [] });

    await connectMongo();
    // Matches either the unique @handle (chatHandleLower) or the free-text display name
    // (username) - most people haven't set a handle yet, and searching by the name they
    // actually see everywhere else in the app (profile, login) is what users expect "search
    // by name" to mean, not just the newer @handle concept.
    const pattern = new RegExp(escapeRegex(q), 'i');
    const matches = await MyraProfile.find({
      userId: { $ne: user._id },
      $or: [{ chatHandleLower: { $regex: pattern } }, { username: { $regex: pattern } }],
    })
      .select('userId chatHandle username avatar bio subscriptionType isAdmin badgeOverride')
      .limit(20)
      .lean<
        {
          userId: any;
          chatHandle: string;
          username: string;
          avatar: string | null;
          bio: string;
          subscriptionType: string;
          isAdmin: boolean;
          badgeOverride: string | null;
        }[]
      >();

    return success({
      users: matches.map((m) => ({
        id: m.userId.toString(),
        // Prefer the claimed handle; fall back to the display name for anyone who hasn't
        // set one up yet, so they're still findable and messageable.
        username: m.chatHandle || m.username || 'User',
        avatar: m.avatar,
        bio: m.bio || '',
        ...chatBadgeFields(m),
      })),
    });
  },
  { rateLimit: { scope: 'myra-users-search', max: 60 } }
);
