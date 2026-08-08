export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../../_lib/middleware/handler';
import { requireAdmin } from '../../../../_lib/middleware/admin';
import { success, ApiError } from '../../../../_lib/utils/response';
import { optionalString } from '../../../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { MarketplaceProduct } from '@/lib/db/models';
import { notifyNewAppRelease } from '../../../../_lib/services/appReleaseService';

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
    thumbnail_url: p.thumbnailUrl,
    banner_url: p.bannerUrl,
    screenshots: p.screenshots || [],
    file_path: p.filePath,
    file_name: p.fileName,
    file_size: p.fileSize,
    is_published: p.isPublished,
    download_count: p.downloadCount,
    version_name: p.versionName ?? null,
    version_code: p.versionCode ?? null,
    is_app_release: !!p.isAppRelease,
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
    if (body.thumbnail_url !== undefined) set.thumbnailUrl = optionalString(body.thumbnail_url, 'thumbnail_url', 2048);
    if (body.banner_url !== undefined) set.bannerUrl = optionalString(body.banner_url, 'banner_url', 2048);
    if (body.screenshots !== undefined) set.screenshots = Array.isArray(body.screenshots) ? body.screenshots.slice(0, 20) : [];
    if (body.file_path !== undefined) set.filePath = optionalString(body.file_path, 'file_path', 2048);
    if (body.file_name !== undefined) set.fileName = optionalString(body.file_name, 'file_name', 255);
    if (body.file_size !== undefined) set.fileSize = Number(body.file_size) || 0;
    if (body.is_published !== undefined) set.isPublished = Boolean(body.is_published);
    if (body.version_name !== undefined) set.versionName = optionalString(body.version_name, 'version_name', 32);
    if (body.version_code !== undefined) {
      set.versionCode = body.version_code === null || body.version_code === '' ? null : Number(body.version_code);
    }
    const settingAsRelease = body.is_app_release !== undefined && Boolean(body.is_app_release);
    if (body.is_app_release !== undefined) set.isAppRelease = Boolean(body.is_app_release);

    await connectMongo();
    const before = await MarketplaceProduct.findById(id).select('versionCode').lean();
    if (!before) throw ApiError.notFound('Product not found.', 'PRODUCT_NOT_FOUND');

    if (settingAsRelease) {
      // Exactly one product can represent the current MYRA app release.
      await MarketplaceProduct.updateMany({ _id: { $ne: id }, isAppRelease: true }, { $set: { isAppRelease: false } });
    }

    const product = await MarketplaceProduct.findByIdAndUpdate(id, { $set: set }, { new: true });
    if (!product) throw ApiError.notFound('Product not found.', 'PRODUCT_NOT_FOUND');

    const versionChanged = (before as any).versionCode !== product.versionCode;
    if (product.isAppRelease && product.isPublished && product.versionName && versionChanged) {
      void notifyNewAppRelease(product);
    }

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
