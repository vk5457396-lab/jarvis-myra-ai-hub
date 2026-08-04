export const runtime = 'nodejs';
export const maxDuration = 120;

import { put } from '@vercel/blob';
import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';

export const OPTIONS = handleOptions(['POST']);

/**
 * Admin-only file upload proxy to Vercel Blob — replaces direct browser uploads
 * to Supabase Storage. `access` controls public (thumbnails/banners) vs private
 * (paid product files, only ever read back through /api/marketplace/download).
 */
export const POST = withApi(
  async (req) => {
    await requireAdmin(req);

    const form = await req.formData();
    const file = form.get('file');
    const folder = String(form.get('folder') || 'uploads').replace(/[^a-z0-9/_-]/gi, '');
    const access = form.get('access') === 'private' ? 'private' : 'public';

    if (!(file instanceof File)) {
      throw ApiError.badRequest('file is required.', 'MISSING_FIELD', { field: 'file' });
    }

    const pathname = `${folder}/${Date.now()}-${file.name}`;
    const blob = await put(pathname, file, { access, addRandomSuffix: true });

    return success({ url: blob.url, pathname: blob.pathname }, 'Uploaded.', 201);
  },
  { rateLimit: { scope: 'admin-blob-upload', max: 60 } }
);
