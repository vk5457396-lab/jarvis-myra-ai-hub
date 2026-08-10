export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { optionalString, optionalUrl, requireString } from '../../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { AppRelease, APP_RELEASE_ID } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET', 'PUT']);

/**
 * Admin: what the public website's Download page shows/links to - deliberately a separate
 * endpoint and separate fields from PUT /api/app/release/admin (the in-app OTA update), so
 * cutting a new GitHub release for the app never touches this without the admin explicitly
 * coming here and saving it too.
 */
export const GET = withApi(async (req) => {
  await requireAdmin(req);

  await connectMongo();
  const doc = await AppRelease.findById(APP_RELEASE_ID).lean();

  return success(
    doc
      ? {
          version_name: doc.publicVersionName,
          release_notes: doc.publicReleaseNotes,
          file_size_mb: doc.publicFileSizeMb,
          apk_asset_url: doc.publicApkAssetUrl,
          updated_at: doc.updatedAt,
          // Shown alongside so the admin can see what the OTA side currently has, without
          // this form being able to change it.
          ota_version_name: doc.versionName,
          ota_apk_asset_url: doc.apkAssetUrl,
        }
      : {}
  );
});

/** Admin: update only the public website download - never fires the app_update push notification. */
export const PUT = withApi(
  async (req) => {
    const admin = await requireAdmin(req);

    const body = await req.json();
    const versionName = requireString(body.version_name, 'version_name', { min: 1, max: 32 });
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
          publicVersionName: versionName,
          publicReleaseNotes: releaseNotes,
          publicApkAssetUrl: apkAssetUrl,
          publicFileSizeMb: fileSizeMb,
          publicUpdatedBy: admin.userId ?? null,
        },
      },
      { new: true, upsert: true }
    );

    return success(
      {
        version_name: doc.publicVersionName,
        release_notes: doc.publicReleaseNotes,
        file_size_mb: doc.publicFileSizeMb,
        apk_asset_url: doc.publicApkAssetUrl,
        updated_at: doc.updatedAt,
      },
      'Public website download updated.'
    );
  },
  { rateLimit: { scope: 'app-release-public-update', max: 30 } }
);
