export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success } from '../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { Profile } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

/** Mirrors get_referrer_by_code(): only exposes id + full_name, never the full profile. */
export const GET = withApi(async (req) => {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return success({ referrer: null });

  await connectMongo();
  const referrer = await Profile.findOne({ referralCode: code }).select('fullName').lean();

  return success({
    referrer: referrer ? { id: (referrer as any)._id.toString(), full_name: (referrer as any).fullName } : null,
  });
});
