export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success, ApiError } from '../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { PcRelease, PC_RELEASE_ID } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

/**
 * Public: what the website's Download page / home & pricing PC Controller cards link to.
 * Always free, no login/access-key gating — the app itself already opens the MediaFire link
 * directly in a new tab, so this is just "is a link configured yet".
 */
export const GET = withApi(async () => {
  await connectMongo();
  const doc = await PcRelease.findById(PC_RELEASE_ID).lean();

  if (!doc || !doc.downloadUrl) throw ApiError.notFound('No PC Controller release configured yet.', 'PC_RELEASE_NOT_CONFIGURED');

  const res = success({
    download_url: doc.downloadUrl,
    version_name: doc.versionName,
    file_size_mb: doc.fileSizeMb,
    updated_at: doc.updatedAt,
  });
  // Public, non-personalized, and only changes when an admin publishes a release - same
  // edge-cache pattern as /api/app/release.
  res.headers.set('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600');
  return res;
});
