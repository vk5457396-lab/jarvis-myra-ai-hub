export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { requireString, optionalString, optionalUrl } from '../../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { MarketplaceProduct } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET', 'POST']);

function toAdmin(p: any) {
  return {
    id: p._id.toString(),
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
    file_path: p.filePath,
    external_download_url: p.externalDownloadUrl,
    file_name: p.fileName,
    file_size: p.fileSize,
    is_published: p.isPublished,
    download_count: p.downloadCount,
    created_at: p.createdAt,
  };
}

/** Admin: full product list, published and hidden. */
export const GET = withApi(async (req) => {
  await requireAdmin(req);
  await connectMongo();
  const docs = await MarketplaceProduct.find().sort({ createdAt: -1 }).lean();
  return success({ products: docs.map(toAdmin) });
});

export const POST = withApi(
  async (req) => {
    await requireAdmin(req);
    const body = await req.json();

    const title = requireString(body.title, 'title', { min: 1, max: 200 });
    const slug = requireString(body.slug, 'slug', { min: 1, max: 100 });
    const filePath = optionalString(body.file_path, 'file_path', 2048);
    const externalDownloadUrl = optionalUrl(body.external_download_url, 'external_download_url');
    if (!filePath && !externalDownloadUrl) {
      throw ApiError.badRequest(
        'Either upload a file or provide a direct download link.',
        'MISSING_FIELD',
        { field: 'file_path' }
      );
    }

    await connectMongo();

    const existing = await MarketplaceProduct.findOne({ slug });
    if (existing) throw ApiError.conflict('A product with this slug already exists.', 'SLUG_TAKEN');

    const product = await MarketplaceProduct.create({
      title,
      slug,
      shortDescription: optionalString(body.short_description, 'short_description', 300),
      description: optionalString(body.description, 'description', 10000),
      category: optionalString(body.category, 'category', 40) || 'general',
      price: Number(body.price) || 0,
      originalPrice: body.original_price ? Number(body.original_price) : null,
      thumbnailUrl: optionalString(body.thumbnail_url, 'thumbnail_url', 2048),
      bannerUrl: optionalString(body.banner_url, 'banner_url', 2048),
      screenshots: Array.isArray(body.screenshots) ? body.screenshots.slice(0, 20) : [],
      filePath,
      externalDownloadUrl,
      fileName: optionalString(body.file_name, 'file_name', 255),
      fileSize: Number(body.file_size) || 0,
      isPublished: body.is_published !== false,
    });

    return success({ product: toAdmin(product) }, 'Product created.', 201);
  },
  { rateLimit: { scope: 'admin-marketplace-products', max: 30 } }
);
