import { Purchase, MarketplaceDownload, SiteSettings, SITE_SETTINGS_ID } from '@/lib/db/models';
import { countWebsitePurchases } from './myraAccessKeyFirestoreService';
import logger from '../utils/logger';

export type SalesRow = { product_type: string; count: number; revenue: number; source: string };

export type OfflineSales = { jarvis: number; myra: number; bundle: number };

export async function getOfflineSales(): Promise<OfflineSales> {
  const doc: any = await SiteSettings.findById(SITE_SETTINGS_ID).lean();
  return {
    jarvis: doc?.offlineSales?.jarvis ?? 0,
    myra: doc?.offlineSales?.myra ?? 0,
    bundle: doc?.offlineSales?.bundle ?? 0,
  };
}

/**
 * Every sale we can count, by source:
 * - `purchases`: Razorpay checkouts recorded by /api/payments/notify (Jarvis, source code, ...)
 * - `myra_website`: MYRA for Android bought on the website (Firestore payment locks, ₹999 each)
 * - `marketplace`: paid marketplace downloads, one per distinct Razorpay payment
 * - `offline`: admin-entered sales that never went through this website
 * Each source is best-effort: one failing source never zeroes the whole counter.
 */
export async function computeSalesRows(): Promise<SalesRow[]> {
  const rows: SalesRow[] = [];

  try {
    const agg = await Purchase.aggregate([
      { $group: { _id: '$productType', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
    ]);
    for (const r of agg) rows.push({ product_type: r._id, count: r.count, revenue: r.revenue, source: 'purchases' });
  } catch (err) {
    logger.error('Sales stats: purchases failed', { detail: (err as Error)?.message });
  }

  try {
    const myra = await countWebsitePurchases();
    if (myra > 0) rows.push({ product_type: 'myra', count: myra, revenue: myra * 999, source: 'myra_website' });
  } catch (err) {
    logger.error('Sales stats: MYRA website purchases failed', { detail: (err as Error)?.message });
  }

  try {
    const mkt = await MarketplaceDownload.aggregate([
      { $match: { paymentId: { $type: 'string' } } },
      { $group: { _id: '$paymentId', amount: { $first: '$amount' } } },
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
    ]);
    if (mkt[0]?.count) rows.push({ product_type: 'marketplace', count: mkt[0].count, revenue: mkt[0].revenue, source: 'marketplace' });
  } catch (err) {
    logger.error('Sales stats: marketplace failed', { detail: (err as Error)?.message });
  }

  try {
    const offline = await getOfflineSales();
    for (const [type, count] of Object.entries(offline)) {
      if (count > 0) rows.push({ product_type: type, count, revenue: 0, source: 'offline' });
    }
  } catch (err) {
    logger.error('Sales stats: offline sales failed', { detail: (err as Error)?.message });
  }

  return rows;
}
