export const runtime = 'nodejs';
export const maxDuration = 15;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import { success } from '../../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { MyraProfile } from '@/lib/db/models';

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
    const pattern = new RegExp('^' + escapeRegex(q.toLowerCase()), 'i');
    const matches = await MyraProfile.find({
      chatHandleLower: { $regex: pattern },
      userId: { $ne: user._id },
    })
      .select('userId chatHandle avatar bio')
      .limit(20)
      .lean<{ userId: any; chatHandle: string; avatar: string | null; bio: string }[]>();

    return success({
      users: matches.map((m) => ({
        id: m.userId.toString(),
        username: m.chatHandle,
        avatar: m.avatar,
        bio: m.bio || '',
      })),
    });
  },
  { rateLimit: { scope: 'myra-users-search', max: 60 } }
);
