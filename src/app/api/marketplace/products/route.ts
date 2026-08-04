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
    thumbnail_url: p.thumbnailUrl,
    download_count: p.downloadCount,
  };
}

/** Public: published products only, for the /products listing page. */
export const GET = withApi(async () => {
  await connectMongo();
  const docs = await MarketplaceProduct.find({ isPublished: true }).sort({ createdAt: -1 }).lean();
  return success({ products: docs.map(toPublic) });
});
