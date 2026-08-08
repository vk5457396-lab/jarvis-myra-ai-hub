export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { success, ApiError } from '../../../_lib/utils/response';
import { auth } from '@/lib/auth/config';
import { connectMongo } from '@/lib/db/mongoose';
import { MyraAccessKey } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

/** The signed-in user's own MYRA access keys, for the dashboard. */
export const GET = withApi(async () => {
  const session = await auth();
  if (!session?.user?.email) throw ApiError.unauthorized('Login required.', 'AUTH_REQUIRED');

  await connectMongo();
  const docs = await MyraAccessKey.find({ assignedEmail: session.user.email.toLowerCase() })
    .sort({ createdAt: -1 })
    .lean();

  return success({
    keys: docs.map((k: any) => ({
      key: k.key,
      plan: k.plan,
      status: k.status,
      redeemed_at: k.redeemedAt,
      created_at: k.createdAt,
    })),
  });
});
