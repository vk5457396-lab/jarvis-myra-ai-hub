export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../_lib/middleware/handler';
import { success } from '../_lib/utils/response';
import { loadPricingConfig, publicPricing } from '../_lib/services/pricingService';

export const OPTIONS = handleOptions(['GET']);

/**
 * Public: every product's list price and offer price plus the scheduled offer. CDN-cached for a
 * minute; clients decide "upcoming / live / ended" from the offer's own timestamps, so the cache
 * never shows a stale phase. The charged amount is always recomputed server-side at order time.
 */
export const GET = withApi(async () => {
  const cfg = await loadPricingConfig();
  const res = success(publicPricing(cfg));
  res.headers.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  return res;
});
