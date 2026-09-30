export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireAdmin } from '../../_lib/middleware/admin';
import { success } from '../../_lib/utils/response';
import { validateEnum } from '../../_lib/utils/validation';
import { connectMongo } from '@/lib/db/mongoose';
import { AppReview, REVIEW_APPS, toPublicReview } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

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
  return success({
    summary: {
      count: shown.length,
      average: shown.length ? Math.round((total / shown.length) * 10) / 10 : 0,
      distribution,
    },
    reviews: reviews.map((r: any) => ({ ...toPublicReview(r), hidden: !!r.hidden })),
  });
});
