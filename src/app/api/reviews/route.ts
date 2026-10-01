export const runtime = 'nodejs';
export const maxDuration = 30;

import mongoose from 'mongoose';
import { withApi, handleOptions } from '../_lib/middleware/handler';
import { requireUser } from '../_lib/middleware/user';
import { success, ApiError } from '../_lib/utils/response';
import { validateEnum } from '../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { auth } from '@/lib/auth/config';
import { AppReview, AppReviewSetting, Profile, REVIEW_APPS, toPublicReview } from '@/lib/db/models';
import { getMyraDownloadAccess } from '../_lib/services/myraDownloadAccess';

export const OPTIONS = handleOptions(['GET', 'POST', 'DELETE']);

const PAGE = 10;

/** "Vikash Kumar" → "Vikash K." so reviews show a real person without their full name/email. */
function displayNameFor(profile: any): string {
  const full = String(profile?.fullName || '').trim();
  if (full) {
    const [first, ...rest] = full.split(/\s+/);
    const last = rest.pop();
    return last ? `${first} ${last[0].toUpperCase()}.` : first;
  }
  const local = String(profile?.email || '').split('@')[0];
  return local ? `${local.slice(0, 1).toUpperCase()}${local.slice(1, 3)}***` : 'MYRA user';
}

async function summaryFor(app: string) {
  const rows = await AppReview.aggregate([{ $match: { app, hidden: { $ne: true } } }, { $group: { _id: '$rating', n: { $sum: 1 } } }]);
  const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  let count = 0;
  let total = 0;
  for (const r of rows) {
    distribution[String(r._id)] = r.n;
    count += r.n;
    total += r._id * r.n;
  }

  const base = { count, average: count ? Math.round((total / count) * 10) / 10 : 0, distribution };
  const override = (await AppReviewSetting.findOne({ app }).lean()) as any;

  if (override?.countOverride != null) {
    base.count = Math.max(0, Number(override.countOverride));
  }
  if (override?.averageOverride != null) {
    base.average = Math.min(5, Math.max(1, Number(override.averageOverride)));
  }

  return base;
}

/**
 * GET ?app=… → public rating summary + newest reviews (paged), CDN-cached for 5 minutes so page views
 * don't each run a function. GET ?app=…&mine=1 → the signed-in caller's own review (private, uncached).
 */
export const GET = withApi(async (req) => {
  const app = validateEnum(req.nextUrl.searchParams.get('app'), 'app', [...REVIEW_APPS]);
  await connectMongo();

  if (req.nextUrl.searchParams.get('mine') === '1') {
    const session = await auth();
    const mine =
      session?.user?.id && mongoose.isValidObjectId(session.user.id)
        ? await AppReview.findOne({ app, userId: session.user.id }).lean()
        : null;
    return success({ mine: mine ? toPublicReview(mine) : null });
  }

  const offset = Math.max(0, Math.min(10_000, Number(req.nextUrl.searchParams.get('offset')) || 0));
  const [summary, reviews] = await Promise.all([
    summaryFor(app),
    AppReview.find({ app, hidden: { $ne: true } }).sort({ createdAt: -1 }).skip(offset).limit(PAGE + 1).lean(),
  ]);

  const res = success({
    summary,
    reviews: reviews.slice(0, PAGE).map(toPublicReview),
    has_more: reviews.length > PAGE,
  });
  res.headers.set('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600');
  return res;
});

/** Signed-in users post or update their review. MYRA for Android requires a purchase. */
export const POST = withApi(
  async (req) => {
    const user = await requireUser();
    const body = await req.json();
    const app = validateEnum(body.app, 'app', [...REVIEW_APPS]);
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw ApiError.badRequest('Choose a rating from 1 to 5 stars.', 'INVALID_RATING');
    }
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 500) : '';

    await connectMongo();
    const profile: any = await Profile.findById(user.id).select('fullName email').lean();
    if (!profile) throw ApiError.notFound('Profile not found.', 'PROFILE_NOT_FOUND');

    let verified = false;
    if (app === 'myra-android') {
      const { hasAccess } = await getMyraDownloadAccess(profile.email);
      if (!hasAccess) {
        throw new ApiError(403, 'Only people who bought MYRA can review it.', 'PURCHASE_REQUIRED');
      }
      verified = true;
    }

    const review = await AppReview.findOneAndUpdate(
      { app, userId: user.id },
      { $set: { rating, text, verified, displayName: displayNameFor(profile) } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return success({ review: toPublicReview(review), summary: await summaryFor(app) }, 'Review posted.');
  },
  { rateLimit: { scope: 'reviews-post', max: 20 } }
);

/** Delete: your own review, or (admins) any review by id. */
export const DELETE = withApi(
  async (req) => {
    const user = await requireUser();
    const app = validateEnum(req.nextUrl.searchParams.get('app'), 'app', [...REVIEW_APPS]);
    const id = req.nextUrl.searchParams.get('id');
    await connectMongo();

    if (id) {
      if (user.role !== 'admin') throw ApiError.forbidden('Only admins can remove other reviews.', 'FORBIDDEN');
      if (!mongoose.isValidObjectId(id)) throw ApiError.notFound('Review not found.', 'REVIEW_NOT_FOUND');
      await AppReview.deleteOne({ _id: id, app });
    } else {
      await AppReview.deleteOne({ app, userId: user.id });
    }
    return success({ summary: await summaryFor(app) }, 'Review removed.');
  },
  { rateLimit: { scope: 'reviews-delete', max: 30 } }
);
