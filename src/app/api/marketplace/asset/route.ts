export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { ApiError } from '../../_lib/utils/response';

export const OPTIONS = handleOptions(['GET']);

/**
 * Public, unauthenticated proxy for "public" marketing images (thumbnails,
 * banners, screenshots). The Blob store backing this project is private-only,
 * so these images can't be linked to directly — every <img> tag goes through
 * this route instead, which reads the blob server-side with the Blob SDK
 * (authenticated via BLOB_READ_WRITE_TOKEN) and streams it back.
 */
export const GET = withApi(async (req: NextRequest) => {
  const path = req.nextUrl.searchParams.get('path');
  if (!path) throw ApiError.badRequest('path is required.', 'MISSING_FIELD', { field: 'path' });

  let result;
  try {
    result = await get(path, { access: 'private' });
  } catch {
    throw ApiError.notFound('Asset not found.', 'ASSET_NOT_FOUND');
  }
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw ApiError.notFound('Asset not found.', 'ASSET_NOT_FOUND');
  }

  return new NextResponse(result.stream, {
    status: 200,
    headers: {
      'Content-Type': result.blob.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});
