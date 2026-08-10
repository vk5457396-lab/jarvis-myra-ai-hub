export const runtime = 'nodejs';
export const maxDuration = 15;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import { success } from '../../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { MyraProfile } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

// Directory of everyone who has ever logged in - a MyraProfile doc is created for every
// account on its first bootstrap (see ensureMyraState), whether or not they've claimed a
// unique @handle yet, so this deliberately does NOT filter on chatHandleLower.
export const GET = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    await connectMongo();

    const profiles = await MyraProfile.find({ userId: { $ne: user._id } })
      .select('userId chatHandle username avatar bio subscriptionType isAdmin')
      .sort({ isAdmin: -1, chatHandleLower: 1, username: 1 })
      .limit(500)
      .lean<
        {
          userId: any;
          chatHandle: string;
          username: string;
          avatar: string | null;
          bio: string;
          subscriptionType: string;
          isAdmin: boolean;
        }[]
      >();

    return success({
      users: profiles.map((p) => ({
        id: p.userId.toString(),
        username: p.chatHandle || p.username || 'User',
        avatar: p.avatar,
        bio: p.bio || '',
        subscription_type: p.subscriptionType,
        is_admin: Boolean(p.isAdmin),
      })),
    });
  },
  { rateLimit: { scope: 'myra-users-all', max: 30 } }
);
