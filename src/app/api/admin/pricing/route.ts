export const runtime = 'nodejs';
export const maxDuration = 30;

import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { requireAdmin } from '../../_lib/middleware/admin';
import { success, ApiError } from '../../_lib/utils/response';
import { connectMongo } from '@/lib/db/mongoose';
import { SiteSettings, SITE_SETTINGS_ID } from '@/lib/db/models';
import { MANAGED_PRODUCTS, STORE_SCOPE, type OfferConfig } from '@/lib/offers';
import { invalidatePricingCache, loadPricingConfig, type PriceOverrides } from '../../_lib/services/pricingService';

export const OPTIONS = handleOptions(['GET', 'PUT']);

const VALID_SCOPES = new Set([...MANAGED_PRODUCTS.map((p) => p.id), STORE_SCOPE]);

/** Admin: the saved config plus the code-default list prices the overrides sit on. */
export const GET = withApi(async (req) => {
  await requireAdmin(req);
  invalidatePricingCache();
  const cfg = await loadPricingConfig();
  return success({
    products: MANAGED_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      default_price: p.price,
      default_intl: p.intl,
      price: cfg.overrides[p.id]?.price ?? null,
      intl: cfg.overrides[p.id]?.intl ?? null,
    })),
    offer: cfg.offer,
    store_scope: STORE_SCOPE,
  });
});

function parseRupees(v: unknown, label: string): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 1_000_000) {
    throw ApiError.badRequest(`${label} must be a whole rupee amount of at least 1.`);
  }
  return n;
}

export const PUT = withApi(async (req) => {
  const admin = await requireAdmin(req);
  const body = await req.json();

  const overrides: PriceOverrides = {};
  for (const [id, v] of Object.entries<any>(body.overrides || {})) {
    if (!MANAGED_PRODUCTS.some((p) => p.id === id)) continue;
    const price = parseRupees(v?.price, `${id} price`);
    const intl = parseRupees(v?.intl, `${id} international price`);
    if (price != null || intl != null) overrides[id] = { ...(price != null ? { price } : {}), ...(intl != null ? { intl } : {}) };
  }

  const o = body.offer || {};
  const discountPercent = Number(o.discountPercent);
  if (!Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 90) {
    throw ApiError.badRequest('Discount must be between 1% and 90%.');
  }
  const starts = new Date(o.startsAt);
  const ends = new Date(o.endsAt);
  if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) throw ApiError.badRequest('Start and end time are required.');
  if (ends <= starts) throw ApiError.badRequest('The offer must end after it starts.');
  const name = String(o.name || '').trim().slice(0, 60);
  if (!name) throw ApiError.badRequest('Give the offer a name.');
  let productIds: string[] | null = null;
  if (Array.isArray(o.productIds)) {
    productIds = o.productIds.filter((id: unknown): id is string => typeof id === 'string' && VALID_SCOPES.has(id));
  }

  const offer: OfferConfig = {
    enabled: o.enabled !== false,
    name,
    discountPercent: Math.round(discountPercent),
    startsAt: starts.toISOString(),
    endsAt: ends.toISOString(),
    productIds,
  };

  await connectMongo();
  await SiteSettings.updateOne(
    { _id: SITE_SETTINGS_ID },
    { $set: { pricing: { overrides, offer }, updatedBy: admin.userId || admin.via } },
    { upsert: true }
  );
  invalidatePricingCache();
  return success({ overrides, offer }, 'Pricing saved.');
});
