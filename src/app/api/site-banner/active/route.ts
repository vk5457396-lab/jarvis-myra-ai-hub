export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success } from '../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { SiteBanner, toPublicSiteBanner } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

/** Public: the one live event/offer popup for the website, or null. CDN-cached for a minute. */
export const GET = withApi(async () => {
  await connectMongo();
  const now = new Date();
  const banner = await SiteBanner.findOne({
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] },
    ],
  })
    .sort({ updatedAt: -1 })
    .lean();

  const res = success({ banner: banner ? toPublicSiteBanner(banner) : null });
  res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return res;
});
