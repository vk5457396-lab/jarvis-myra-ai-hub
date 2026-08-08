export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success, ApiError } from '../../_lib/utils/response';
import { getCurrentAppRelease } from '../../_lib/services/appReleaseService';

export const OPTIONS = handleOptions(['GET']);

/**
 * Public: current MYRA release metadata. Sourced from the Products admin
 * (the product flagged "is_app_release") so there is one upload flow for
 * both the website's downloadable products and the Android app itself.
 */
export const GET = withApi(async () => {
  const product = await getCurrentAppRelease();
  if (!product) throw ApiError.notFound('No release configured yet.', 'RELEASE_NOT_CONFIGURED');

  return success({
    product_id: (product as any)._id.toString(),
    version_name: product.versionName,
    version_code: product.versionCode,
    release_notes: product.description || product.shortDescription,
    file_size_mb: product.fileSize ? Number((product.fileSize / (1024 * 1024)).toFixed(2)) : null,
    thumbnail_url: product.thumbnailUrl,
    updated_at: product.updatedAt,
  });
});
