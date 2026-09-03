export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { optionalString, optionalUrl, requireString } from '../../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { PcRelease, PC_RELEASE_ID } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET', 'PUT']);

/** Admin: the MYRA PC Controller (.exe) download link shown on the website. */
export const GET = withApi(async (req) => {
  await requireAdmin(req);

  await connectMongo();
  const doc = await PcRelease.findById(PC_RELEASE_ID).lean();

  return success(
    doc
      ? {
          version_name: doc.versionName,
          download_url: doc.downloadUrl,
          file_size_mb: doc.fileSizeMb,
          updated_at: doc.updatedAt,
        }
      : {}
  );
});

/** Admin: update the PC Controller download link (e.g. after uploading a new build to MediaFire). */
export const PUT = withApi(
  async (req) => {
    const admin = await requireAdmin(req);

    const body = await req.json();
    const versionName = optionalString(body.version_name, 'version_name', 32);
    const downloadUrl = optionalUrl(body.download_url, 'download_url');
    const fileSizeMb =
      body.file_size_mb === undefined || body.file_size_mb === null || body.file_size_mb === ''
        ? null
        : Number(body.file_size_mb);

    if (!downloadUrl) {
      throw ApiError.badRequest('download_url is required.', 'MISSING_FIELD', { field: 'download_url' });
    }

    await connectMongo();
    const doc = await PcRelease.findByIdAndUpdate(
      PC_RELEASE_ID,
      {
        $set: {
          versionName,
          downloadUrl,
          fileSizeMb,
          updatedBy: admin.userId ?? null,
        },
      },
      { new: true, upsert: true }
    );

    return success(
      {
        version_name: doc.versionName,
        download_url: doc.downloadUrl,
        file_size_mb: doc.fileSizeMb,
        updated_at: doc.updatedAt,
      },
      'PC Controller download updated.'
    );
  },
  { rateLimit: { scope: 'pc-release-update', max: 30 } }
);
