export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../../_lib/middleware/handler';
import { requireAdmin } from '../../../../_lib/middleware/admin';
import { success, ApiError } from '../../../../_lib/utils/response';
import { optionalString } from '../../../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { MarketplaceProduct } from '@/lib/db/models';

export const OPTIONS = handleOptions(['PUT', 'DELETE']);

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
    file_name: p.fileName,
    file_size: p.fileSize,
    is_published: p.isPublished,
    download_count: p.downloadCount,
    created_at: p.createdAt,
  };
}

export const PUT = withApi(
  async (req) => {
    await requireAdmin(req);
    const id = req.nextUrl.pathname.split('/').pop()!;
    const body = await req.json();

    const set: Record<string, any> = {};
    if (body.title !== undefined) set.title = optionalString(body.title, 'title', 200);
    if (body.slug !== undefined) set.slug = optionalString(body.slug, 'slug', 100);
    if (body.short_description !== undefined) set.shortDescription = optionalString(body.short_description, 'short_description', 300);
    if (body.description !== undefined) set.description = optionalString(body.description, 'description', 10000);
    if (body.category !== undefined) set.category = optionalString(body.category, 'category', 40) || 'general';
    if (body.price !== undefined) set.price = Number(body.price) || 0;
    if (body.original_price !== undefined) {
      set.originalPrice = body.original_price ? Number(body.original_price) : null;
    }
    if (body.thumbnail_url !== undefined) set.thumbnailUrl = optionalString(body.thumbnail_url, 'thumbnail_url', 2048);
    if (body.banner_url !== undefined) set.bannerUrl = optionalString(body.banner_url, 'banner_url', 2048);
    if (body.screenshots !== undefined) set.screenshots = Array.isArray(body.screenshots) ? body.screenshots.slice(0, 20) : [];
    if (body.file_path !== undefined) set.filePath = optionalString(body.file_path, 'file_path', 2048);
    if (body.file_name !== undefined) set.fileName = optionalString(body.file_name, 'file_name', 255);
    if (body.file_size !== undefined) set.fileSize = Number(body.file_size) || 0;
    if (body.is_published !== undefined) set.isPublished = Boolean(body.is_published);

    await connectMongo();
    const product = await MarketplaceProduct.findByIdAndUpdate(id, { $set: set }, { new: true });
    if (!product) throw ApiError.notFound('Product not found.', 'PRODUCT_NOT_FOUND');

    return success({ product: toAdmin(product) }, 'Product updated.');
  },
  { rateLimit: { scope: 'admin-marketplace-products', max: 30 } }
);

export const DELETE = withApi(
  async (req) => {
    await requireAdmin(req);
    const id = req.nextUrl.pathname.split('/').pop()!;

    await connectMongo();
    const product = await MarketplaceProduct.findByIdAndDelete(id);
    if (!product) throw ApiError.notFound('Product not found.', 'PRODUCT_NOT_FOUND');

    return success({}, 'Product deleted.');
  },
  { rateLimit: { scope: 'admin-marketplace-products', max: 30 } }
);
