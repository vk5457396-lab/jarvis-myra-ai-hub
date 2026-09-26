export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireUser } from '../../_lib/middleware/user';
import { success } from '../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { claimAndGetReferrer } from '../../_lib/services/referralService';

export const OPTIONS = handleOptions(['GET', 'POST']);

/** The signed-in user's referrer (id + name only), for the "X invited you" banner. */
export const GET = withApi(async () => {
  const user = await requireUser();
  await connectMongo();
  return success({ referrer: await claimAndGetReferrer(user.id) });
});

/** Same, but first binds the account to `code` if it has no referrer yet. */
export const POST = withApi(
  async (req) => {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    await connectMongo();
    return success({ referrer: await claimAndGetReferrer(user.id, body?.code) });
  },
  { rateLimit: { scope: 'referrals-me', max: 60 } }
);
