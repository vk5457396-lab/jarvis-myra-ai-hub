export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success } from '../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { Purchase } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

/**
 * Mirrors get_purchase_counts(): aggregate-only public stats, never raw purchase rows. Rendered
 * on the public homepage/product pages for every visitor (not gated behind auth), and was being
 * re-fetched every 5 minutes per open tab with no server-side caching - every one of those was a
 * full function invocation. This is the one route in the app that overrides the shared
 * `success()` helper's default no-store: the data is public and not personalized, so it's safe to
 * let Vercel's edge serve it from cache instead of invoking this function on every request. See
 * usePurchaseCounts.ts for the matching client-side staleTime/refetchInterval increase.
 */
export const GET = withApi(async () => {
  await connectMongo();
  const rows = await Purchase.aggregate([
    { $group: { _id: '$productType', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
  ]);

  const res = success({
    counts: rows.map((r) => ({ product_type: r._id, count: r.count, revenue: r.revenue })),
  });
  // Edge cache for 2min, serve stale for up to 10min while revalidating in the background -
  // purchase counts don't need to be second-accurate, and this collapses every concurrent
  // visitor's request into at most one origin hit per window instead of one each.
  res.headers.set('Cache-Control', 'public, max-age=0, s-maxage=120, stale-while-revalidate=600');
  return res;
});
