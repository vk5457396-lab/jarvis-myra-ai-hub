export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireAdmin } from '../../_lib/middleware/admin';
import { success, ApiError } from '../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { SiteSettings, SITE_SETTINGS_ID } from '@/lib/db/models';
import { computeSalesRows, getOfflineSales } from '../../_lib/services/salesStatsService';

export const OPTIONS = handleOptions(['GET', 'PUT']);

/** Admin: what the homepage sales counter is made of, per source, plus the editable offline numbers. */
export const GET = withApi(async (req) => {
  await requireAdmin(req);
  await connectMongo();
  const [rows, offline] = await Promise.all([computeSalesRows(), getOfflineSales()]);
  return success({ rows, offline });
});

function count(value: unknown, field: string): number {
  const n = Number(value ?? 0);
  if (!Number.isInteger(n) || n < 0 || n > 1_000_000) {
    throw ApiError.badRequest(`${field} must be a whole number of 0 or more.`, 'INVALID_FIELD', { field });
  }
  return n;
}

/** Admin: set the number of real sales made outside this website, per product. */
export const PUT = withApi(
  async (req) => {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const offlineSales = {
      jarvis: count(body.jarvis, 'jarvis'),
      myra: count(body.myra, 'myra'),
      bundle: count(body.bundle, 'bundle'),
      other: count(body.other, 'other'),
    };
    await connectMongo();
    await SiteSettings.findByIdAndUpdate(
      SITE_SETTINGS_ID,
      { $set: { offlineSales, updatedBy: admin.userId ?? admin.via } },
      { upsert: true, new: true }
    );
    return success({ offline: offlineSales }, 'Sales counter updated.');
  },
  { rateLimit: { scope: 'admin-sales-counter', max: 30 } }
);
