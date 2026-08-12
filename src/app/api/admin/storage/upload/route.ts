export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { uploadToSupabaseStorage } from '@/lib/supabaseStorage';

export const OPTIONS = handleOptions(['POST']);

// Proxied through this function (unlike the Blob upload's direct-from-browser token exchange)
// rather than a client-side Supabase upload - these are small marketing images (banners, push
// notification pictures), nowhere near the ~4.5MB Vercel serverless body cap that made a direct
// upload necessary for Blob's APK-sized product files.
export const POST = withApi(
  async (req) => {
    await requireAdmin(req);

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      throw ApiError.badRequest('file is required.', 'MISSING_FIELD', { field: 'file' });
    }
    const folder = String(form.get('folder') || 'misc').replace(/[^a-z0-9_-]/gi, '');
    const pathname = `${folder}/${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadToSupabaseStorage(pathname, buffer, file.type || 'application/octet-stream');
    return success({ url }, 'Uploaded.');
  },
  { rateLimit: { scope: 'admin-storage-upload', max: 60 } }
);
