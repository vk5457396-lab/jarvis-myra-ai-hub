export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { optionalString, optionalUrl, validatePositiveInt, requireString } from '../../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { AppRelease, APP_RELEASE_ID } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET', 'PUT']);

/** Admin: full release row, including the GitHub asset URL, for the edit form. */
export const GET = withApi(async (req) => {
  await requireAdmin(req);

  await connectMongo();
  const doc = await AppRelease.findById(APP_RELEASE_ID).lean();

  return success(
    doc
      ? {
          version_name: doc.versionName,
          version_code: doc.versionCode,
          release_notes: doc.releaseNotes,
          file_size_mb: doc.fileSizeMb,
          apk_asset_url: doc.apkAssetUrl,
          updated_at: doc.updatedAt,
        }
      : {}
  );
});

/** Admin: update the APK release (asset URL, version, notes). Call after publishing a new GitHub release. */
export const PUT = withApi(
  async (req) => {
    const admin = await requireAdmin(req);

    const body = await req.json();
    const versionName = requireString(body.version_name, 'version_name', { min: 1, max: 32 });
    const versionCode = validatePositiveInt(body.version_code, 'version_code', 1_000_000);
    const releaseNotes = optionalString(body.release_notes, 'release_notes', 4000);
    const apkAssetUrl = optionalUrl(body.apk_asset_url, 'apk_asset_url');
    const fileSizeMb =
      body.file_size_mb === undefined || body.file_size_mb === null || body.file_size_mb === ''
        ? null
        : Number(body.file_size_mb);

    if (!apkAssetUrl) {
      throw ApiError.badRequest('apk_asset_url is required.', 'MISSING_FIELD', { field: 'apk_asset_url' });
    }

    await connectMongo();
    const doc = await AppRelease.findByIdAndUpdate(
      APP_RELEASE_ID,
      {
        $set: {
          versionName,
          versionCode,
          releaseNotes,
          apkAssetUrl,
          fileSizeMb,
          updatedBy: admin.userId ?? null,
        },
      },
      { new: true, upsert: true }
    );

    return success(
      {
        version_name: doc.versionName,
        version_code: doc.versionCode,
        release_notes: doc.releaseNotes,
        file_size_mb: doc.fileSizeMb,
        apk_asset_url: doc.apkAssetUrl,
        updated_at: doc.updatedAt,
      },
      'Release updated.'
    );
  },
  { rateLimit: { scope: 'app-release-update', max: 30 } }
);
