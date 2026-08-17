export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success, ApiError } from '../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { AppRelease, APP_RELEASE_ID } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

/**
 * Public: what the website's Download page / home & pricing download cards show.
 * Deliberately reads the public* fields, NOT the OTA versionName/releaseNotes/fileSizeMb the
 * admin sets when cutting an in-app update — those two are independent by design (see
 * AppRelease model comment). Falls back to the OTA fields only until the admin has set the
 * public fields for the first time, so the page isn't blank before that migration happens.
 */
export const GET = withApi(async () => {
  await connectMongo();
  const doc = await AppRelease.findById(APP_RELEASE_ID)
    .select('versionName versionCode releaseNotes fileSizeMb sha256 publicVersionName publicReleaseNotes publicFileSizeMb updatedAt')
    .lean();

  if (!doc) throw ApiError.notFound('No release configured yet.', 'RELEASE_NOT_CONFIGURED');

  return success({
    version_name: doc.publicVersionName ?? doc.versionName,
    version_code: doc.versionCode,
    release_notes: doc.publicReleaseNotes ?? doc.releaseNotes,
    file_size_mb: doc.publicFileSizeMb ?? doc.fileSizeMb,
    // Not part of the public/OTA split above on purpose: this is the checksum of the OTA
    // apkAssetUrl specifically (what the Android updater actually downloads via
    // /api/app/release/download), so it must always follow that field, never the public one.
    sha256: doc.sha256 ?? null,
    updated_at: doc.updatedAt,
  });
});
