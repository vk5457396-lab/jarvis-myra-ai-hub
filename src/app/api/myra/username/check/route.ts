export const runtime = 'nodejs';
export const maxDuration = 15;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireMobileUser } from '../../../_lib/middleware/mobileAuth';
import { success } from '../../../_lib/utils/response';
import { checkHandleFormat } from '../../../_lib/utils/chatHandle';
import { connectMongo } from '@/lib/db/mongoose';
import { MyraProfile } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

export const GET = withApi(
  async (req) => {
    const { user } = await requireMobileUser(req);
    const value = new URL(req.url).searchParams.get('value') || '';

    const formatRejection = checkHandleFormat(value);
    if (formatRejection) return success(formatRejection);

    const lower = value.trim().toLowerCase();
    await connectMongo();
    const existing = await MyraProfile.findOne({ chatHandleLower: lower })
      .select('userId')
      .lean<{ userId: any }>();

    if (existing && existing.userId.toString() !== user._id.toString()) {
      return success({ available: false, reason: 'This username is already taken.' });
    }
    return success({ available: true, reason: null });
  },
  { rateLimit: { scope: 'myra-username-check', max: 60 } }
);
