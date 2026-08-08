export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { rateLimit } from '../../../_lib/middleware/rateLimit';

export const OPTIONS = handleOptions(['POST']);

/**
 * Admin-only token exchange for direct browser -> Vercel Blob uploads.
 *
 * Only a short-lived upload token round-trips through this serverless
 * function; the file bytes go straight from the browser to Blob storage.
 * This route used to `put()` the file itself, which meant the whole upload
 * was buffered through this function first - Vercel's Node.js Serverless
 * Functions cap request bodies at 4.5MB, so anything APK-sized (50-70MB)
 * silently failed the connection before the body finished sending, and the
 * client's missing error handling left the "Uploading..." spinner stuck
 * forever (fixed alongside this in AdminProductsTab.tsx).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        await requireAdmin(request);
        rateLimit(request, { scope: 'admin-blob-upload', max: 60 });
        return { addRandomSuffix: true };
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Upload authorization failed.' },
      { status: 400 }
    );
  }
}
