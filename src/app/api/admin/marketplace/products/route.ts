export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { requireString, optionalString } from '../../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { MarketplaceProduct } from '@/lib/db/models';
import { notifyNewAppRelease } from '../../../_lib/services/appReleaseService';

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
    const filePath = requireString(body.file_path, 'file_path', { min: 1, max: 2048 });

    await connectMongo();

    const existing = await MarketplaceProduct.findOne({ slug });
    if (existing) throw ApiError.conflict('A product with this slug already exists.', 'SLUG_TAKEN');

    const isAppRelease = Boolean(body.is_app_release);
    if (isAppRelease) {
      // Exactly one product can represent the current MYRA app release.
      await MarketplaceProduct.updateMany({ isAppRelease: true }, { $set: { isAppRelease: false } });
    }

    const product = await MarketplaceProduct.create({
      title,
      slug,
      shortDescription: optionalString(body.short_description, 'short_description', 300),
      description: optionalString(body.description, 'description', 10000),
      category: optionalString(body.category, 'category', 40) || 'general',
      price: Number(body.price) || 0,
      thumbnailUrl: optionalString(body.thumbnail_url, 'thumbnail_url', 2048),
      bannerUrl: optionalString(body.banner_url, 'banner_url', 2048),
      screenshots: Array.isArray(body.screenshots) ? body.screenshots.slice(0, 20) : [],
      filePath,
      fileName: optionalString(body.file_name, 'file_name', 255),
      fileSize: Number(body.file_size) || 0,
      isPublished: body.is_published !== false,
      versionName: optionalString(body.version_name, 'version_name', 32),
      versionCode: body.version_code !== undefined && body.version_code !== null ? Number(body.version_code) : null,
      isAppRelease,
    });

    if (isAppRelease && product.isPublished && product.versionName) {
      void notifyNewAppRelease(product);
    }

    return success({ product: toAdmin(product) }, 'Product created.', 201);
  },
  { rateLimit: { scope: 'admin-marketplace-products', max: 30 } }
);
