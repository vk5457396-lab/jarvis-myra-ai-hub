export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { success } from '../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { Purchase } from '@/lib/db/models';

export const OPTIONS = handleOptions(['GET']);

/** Mirrors get_purchase_counts(): aggregate-only public stats, never raw purchase rows. */
export const GET = withApi(async () => {
  await connectMongo();
  const rows = await Purchase.aggregate([
    { $group: { _id: '$productType', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
  ]);

  return success({
    counts: rows.map((r) => ({ product_type: r._id, count: r.count, revenue: r.revenue })),
  });
});
