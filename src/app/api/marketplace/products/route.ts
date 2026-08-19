export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success } from '../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { MarketplaceProduct } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

function toPublic(p: any) {
  return {
    id: p._id.toString(),
    title: p.title,
    slug: p.slug,
    short_description: p.shortDescription,
    category: p.category,
    price: p.price,
    original_price: p.originalPrice ?? null,
    thumbnail_url: p.thumbnailUrl,
    download_count: p.downloadCount,
  };
}

/** Public: published products only, for the /products listing page. */
export const GET = withApi(async () => {
  await connectMongo();
  const docs = await MarketplaceProduct.find({ isPublished: true }).sort({ createdAt: -1 }).lean();
  const res = success({ products: docs.map(toPublic) });
  // Public, non-personalized catalog - same edge-cache pattern as purchases/stats/route.ts.
  // Shorter window than app/release since new products should surface reasonably promptly.
  res.headers.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  return res;
});
