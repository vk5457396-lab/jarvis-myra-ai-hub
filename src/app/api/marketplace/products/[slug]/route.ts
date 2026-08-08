export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { success, ApiError } from '../../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { MarketplaceProduct } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

/** Public: single published product by slug, full details for the product page. */
export const GET = withApi(async (req) => {
  const slug = req.nextUrl.pathname.split('/').pop()!;

  await connectMongo();
  const p = await MarketplaceProduct.findOne({ slug, isPublished: true }).lean();
  if (!p) throw ApiError.notFound('Product not found.', 'PRODUCT_NOT_FOUND');

  return success({
    id: (p as any)._id.toString(),
    title: p.title,
    slug: p.slug,
    short_description: p.shortDescription,
    description: p.description,
    category: p.category,
    price: p.price,
    original_price: p.originalPrice ?? null,
    thumbnail_url: p.thumbnailUrl,
    banner_url: p.bannerUrl,
    screenshots: p.screenshots || [],
    file_name: p.fileName,
    file_size: p.fileSize,
    download_count: p.downloadCount,
  });
});
