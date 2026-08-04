export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { withApi, handleOptions } from '../_lib/middleware/handler';
import { failure } from '../_lib/utils/response';

/**
 * Catch-all so an unknown /api/* path returns JSON instead of an HTML 404 page.
 * Next.js matches concrete routes before this file.
 */
const notFound = withApi(async (req: NextRequest) => {
  const path = new URL(req.url).pathname;
  return failure(404, 'Endpoint not found.', 'ENDPOINT_NOT_FOUND', { path });
});

export const OPTIONS = handleOptions(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
