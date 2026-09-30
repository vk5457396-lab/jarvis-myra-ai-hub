export const runtime = 'nodejs';
export const maxDuration = 30;

import mongoose from 'mongoose';
import { withApi, handleOptions } from '../../../_lib/middleware/handler';
import { requireAdmin } from '../../../_lib/middleware/admin';
import { success, ApiError } from '../../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { AppReview } from '@/lib/db/models';

export const OPTIONS = handleOptions(['PATCH', 'DELETE']);

function reviewIdFromPath(req: { nextUrl: { pathname: string } }): string {
  const id = req.nextUrl.pathname.split('/').pop() as string;
  if (!mongoose.isValidObjectId(id)) throw ApiError.notFound('Review not found.', 'REVIEW_NOT_FOUND');
  return id;
}

/** Admin: hide or show a review on the public listing (`{ hidden: boolean }`). */
export const PATCH = withApi(
  async (req) => {
    await requireAdmin(req);
    const id = reviewIdFromPath(req);
    const body = await req.json();
    if (typeof body.hidden !== 'boolean') throw ApiError.badRequest('hidden must be true or false.', 'INVALID_BODY');
    await connectMongo();
    const res = await AppReview.updateOne({ _id: id }, { $set: { hidden: body.hidden } });
    if (!res.matchedCount) throw ApiError.notFound('Review not found.', 'REVIEW_NOT_FOUND');
    return success({}, body.hidden ? 'Review hidden.' : 'Review visible.');
  },
  { rateLimit: { scope: 'admin-reviews-update', max: 120 } }
);

/** Admin: permanently delete a review. */
export const DELETE = withApi(
  async (req) => {
    await requireAdmin(req);
    const id = reviewIdFromPath(req);
    await connectMongo();
    await AppReview.deleteOne({ _id: id });
    return success({}, 'Review deleted.');
  },
  { rateLimit: { scope: 'admin-reviews-delete', max: 120 } }
);
