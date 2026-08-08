export const runtime = 'nodejs';
export const maxDuration = 120;

import { put } from '@vercel/blob';
import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';

export const OPTIONS = handleOptions(['POST']);

/**
 * Admin-only file upload proxy to Vercel Blob — replaces direct browser uploads
 * to Supabase Storage.
 *
 * The store backing this project is configured private-only (Vercel rejects any
 * `access: 'public'` put with "Cannot use public access on a private store"), so
 * every blob is written with `access: 'private'` regardless of what the caller
 * asks for. The `access` field is kept only as an *intent* signal for the
 * response shape:
 *  - "public" (thumbnails/banners/screenshots): returned as a URL through
 *    /api/marketplace/asset, so <img> tags can render it with no auth.
 *  - "private" (the paid downloadable product file): returned as the raw blob
 *    URL, unchanged — /api/marketplace/download already reads that directly
 *    via the Blob SDK's own `get()`, which needs the blob URL/pathname, not
 *    our proxy's URL.
 */
export const POST = withApi(
  async (req) => {
    await requireAdmin(req);

    const form = await req.formData();
    const file = form.get('file');
    const folder = String(form.get('folder') || 'uploads').replace(/[^a-z0-9/_-]/gi, '');
    const isPublicIntent = form.get('access') !== 'private';

    if (!(file instanceof File)) {
      throw ApiError.badRequest('file is required.', 'MISSING_FIELD', { field: 'file' });
    }

    const pathname = `${folder}/${Date.now()}-${file.name}`;
    const blob = await put(pathname, file, { access: 'private', addRandomSuffix: true });

    const url = isPublicIntent
      ? `/api/marketplace/asset?path=${encodeURIComponent(blob.url)}`
      : blob.url;

    return success({ url, pathname: blob.pathname }, 'Uploaded.', 201);
  },
  { rateLimit: { scope: 'admin-blob-upload', max: 60 } }
);
