export const runtime = 'nodejs';
export const maxDuration = 15;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import { success } from '../../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { MyraProfile } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

// Directory of everyone who has claimed a chat handle - people without one can't be messaged
// yet (no identity to start a conversation against), so they're left out rather than shown
// as an unnamed row.
export const GET = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    await connectMongo();

    const profiles = await MyraProfile.find({
      chatHandleLower: { $exists: true, $ne: '' },
      userId: { $ne: user._id },
    })
      .select('userId chatHandle avatar bio subscriptionType isAdmin')
      .sort({ isAdmin: -1, chatHandleLower: 1 })
      .limit(500)
      .lean<
        {
          userId: any;
          chatHandle: string;
          avatar: string | null;
          bio: string;
          subscriptionType: string;
          isAdmin: boolean;
        }[]
      >();

    return success({
      users: profiles.map((p) => ({
        id: p.userId.toString(),
        username: p.chatHandle,
        avatar: p.avatar,
        bio: p.bio || '',
        subscription_type: p.subscriptionType,
        is_admin: Boolean(p.isAdmin),
      })),
    });
  },
  { rateLimit: { scope: 'myra-users-all', max: 30 } }
);
