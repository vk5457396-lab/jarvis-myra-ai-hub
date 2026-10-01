export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireAdmin } from '../../_lib/middleware/admin';
import { success } from '../../_lib/utils/response';
import { validateEnum } from '../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { AppReview, AppReviewSetting, REVIEW_APPS, toPublicReview } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET', 'PATCH']);

/** Admin: every review for an app (hidden ones included) plus the public average (hidden excluded). */
export const GET = withApi(async (req) => {
  await requireAdmin(req);
  const app = validateEnum(req.nextUrl.searchParams.get('app'), 'app', [...REVIEW_APPS]);
  await connectMongo();

  const reviews = await AppReview.find({ app }).sort({ createdAt: -1 }).limit(500).lean();
  const shown = reviews.filter((r: any) => !r.hidden);
  const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  let total = 0;
  for (const r of shown) {
    distribution[String(r.rating)] += 1;
    total += r.rating;
  }

  const baseSummary = {
    count: shown.length,
    average: shown.length ? Math.round((total / shown.length) * 10) / 10 : 0,
    distribution,
  };
  const override = (await AppReviewSetting.findOne({ app }).lean()) as any;
  const summary = {
    ...baseSummary,
    count: override?.countOverride != null ? Math.max(0, Number(override.countOverride)) : baseSummary.count,
    average: override?.averageOverride != null ? Math.min(5, Math.max(1, Number(override.averageOverride))) : baseSummary.average,
  };

  return success({
    summary,
    override: override
      ? {
          count: override.countOverride != null ? Number(override.countOverride) : null,
          average: override.averageOverride != null ? Number(override.averageOverride) : null,
        }
      : null,
    reviews: reviews.map((r: any) => ({ ...toPublicReview(r), hidden: !!r.hidden })),
  });
});

export const PATCH = withApi(
  async (req) => {
    await requireAdmin(req);
    const body = await req.json();
    const app = validateEnum(body.app, 'app', [...REVIEW_APPS]);

    if (body.reset === true) {
      await connectMongo();
      await AppReviewSetting.deleteOne({ app });
      return success({ override: null }, 'Rating override reset.');
    }

    const count = body.count == null ? null : Number(body.count);
    const average = body.average == null ? null : Number(body.average);

    if (count == null && average == null) {
      throw new Error('Provide count or average to update the rating override.');
    }
    if (count != null && (!Number.isFinite(count) || count < 0)) {
      throw new Error('Public rating count must be zero or above.');
    }
    if (average != null && (!Number.isFinite(average) || average < 1 || average > 5)) {
      throw new Error('Public average rating must be between 1 and 5.');
    }

    await connectMongo();
    await AppReviewSetting.updateOne(
      { app },
      { $set: { app, countOverride: count, averageOverride: average } },
      { upsert: true }
    );

    return success(
      {
        override: {
          count: count != null ? Number(count) : null,
          average: average != null ? Number(average) : null,
        },
      },
      'Rating override saved.'
    );
  },
  { rateLimit: { scope: 'admin-reviews-summary-adjust', max: 30 } }
);
