export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success, ApiError } from '../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { AppRelease, APP_RELEASE_ID } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

/** Public: returns release metadata only — never the GitHub asset URL. */
export const GET = withApi(async () => {
  await connectMongo();
  const doc = await AppRelease.findById(APP_RELEASE_ID)
    .select('versionName versionCode releaseNotes fileSizeMb updatedAt')
    .lean();

  if (!doc) throw ApiError.notFound('No release configured yet.', 'RELEASE_NOT_CONFIGURED');

  return success({
    version_name: doc.versionName,
    version_code: doc.versionCode,
    release_notes: doc.releaseNotes,
    file_size_mb: doc.fileSizeMb,
    updated_at: doc.updatedAt,
  });
});
