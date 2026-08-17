export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import {
  optionalString,
  optionalSha256,
  validateApkAssetUrl,
  validatePositiveInt,
  requireString,
} from '../../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { AppRelease, APP_RELEASE_ID } from '@/lib/db/models';
import { dispatchNotification } from '../../../_lib/services/notificationService';
import logger from '../../../_lib/utils/logger';

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
          sha256: doc.sha256,
          updated_at: doc.updatedAt,
        }
      : {}
  );
});

/** Admin: update the APK release (asset URL, version, notes, checksum). Call after publishing a new GitHub release. */
export const PUT = withApi(
  async (req) => {
    const admin = await requireAdmin(req);

    const body = await req.json();
    const versionName = requireString(body.version_name, 'version_name', { min: 1, max: 32 });
    const versionCode = validatePositiveInt(body.version_code, 'version_code', 1_000_000);
    const releaseNotes = optionalString(body.release_notes, 'release_notes', 4000);
    const apkAssetUrl = validateApkAssetUrl(body.apk_asset_url, 'apk_asset_url');
    // Optional for backward compatibility (existing rows/older admin-panel builds have none
    // yet) - but once a release does carry one, it must be well-formed, never silently dropped.
    let sha256: string | null;
    try {
      sha256 = optionalSha256(body.sha256, 'sha256');
    } catch (error) {
      // Length only, never the value itself - this is exactly what's needed to diagnose an
      // off-by-one paste error (a copy that silently dropped a character) without logging what
      // is effectively a content-integrity secret. Dev-only: an admin's paste habits aren't
      // useful production telemetry.
      if (process.env.NODE_ENV !== 'production' && typeof body.sha256 === 'string') {
        logger.warn('Rejected sha256 on app-release update', {
          receivedLength: body.sha256.trim().length,
          expectedLength: 64,
        });
      }
      throw error;
    }
    const fileSizeMb =
      body.file_size_mb === undefined || body.file_size_mb === null || body.file_size_mb === ''
        ? null
        : Number(body.file_size_mb);

    if (!apkAssetUrl) {
      throw ApiError.badRequest('apk_asset_url is required.', 'MISSING_FIELD', { field: 'apk_asset_url' });
    }

    await connectMongo();
    const previous = await AppRelease.findById(APP_RELEASE_ID).select('versionCode').lean();

    const doc = await AppRelease.findByIdAndUpdate(
      APP_RELEASE_ID,
      {
        $set: {
          versionName,
          versionCode,
          releaseNotes,
          apkAssetUrl,
          sha256,
          fileSizeMb,
          updatedBy: admin.userId ?? null,
        },
      },
      { new: true, upsert: true }
    );

    if (!previous || versionCode > previous.versionCode) {
      dispatchNotification({
        title: `MYRA v${versionName} is available`,
        body: releaseNotes || "Tap to see what's new and update.",
        notification_type: 'app_update',
        priority: 'high',
        target: 'all',
      }).catch((error) => {
        logger.error('Failed to push app-update notification', { detail: (error as Error)?.message });
      });
    }

    return success(
      {
        version_name: doc.versionName,
        version_code: doc.versionCode,
        release_notes: doc.releaseNotes,
        file_size_mb: doc.fileSizeMb,
        apk_asset_url: doc.apkAssetUrl,
        sha256: doc.sha256,
        updated_at: doc.updatedAt,
      },
      'Release updated.'
    );
  },
  { rateLimit: { scope: 'app-release-update', max: 30 } }
);
