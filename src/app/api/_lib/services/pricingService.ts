import { connectMongo } from '@/lib/db/mongoose';
import { SiteSettings, SITE_SETTINGS_ID } from '@/lib/db/models';
import { PRODUCT_PRICES, INTERNATIONAL_PRICES } from '@/lib/pricing';
import {
  DEFAULT_OFFER,
  MANAGED_PRODUCTS,
  MYRA_ANDROID_BASE,
  MYRA_ANDROID_ID,
  STORE_SCOPE,
  discountedPrice,
  offerApplies,
  offerPhase,
  type OfferConfig,
} from '@/lib/offers';

export type PriceOverrides = Record<string, { price?: number; intl?: number | null }>;

export interface PricingConfig {
  overrides: PriceOverrides;
  offer: OfferConfig;
}

const CACHE_MS = 30_000;
let cache: { at: number; cfg: PricingConfig } | null = null;

export function invalidatePricingCache() {
  cache = null;
}

/** Saved admin config merged over the code defaults. Never throws - a DB blip must not stop checkout. */
export async function loadPricingConfig(): Promise<PricingConfig> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.cfg;
  let saved: any = null;
  try {
    await connectMongo();
    const doc: any = await SiteSettings.findById(SITE_SETTINGS_ID).select('pricing').lean();
    saved = doc?.pricing || null;
  } catch {
    if (cache) return cache.cfg;
  }
  const cfg: PricingConfig = {
    overrides: saved?.overrides && typeof saved.overrides === 'object' ? saved.overrides : {},
    offer: saved?.offer ? { ...DEFAULT_OFFER, ...saved.offer } : DEFAULT_OFFER,
  };
  cache = { at: Date.now(), cfg };
  return cfg;
}

/** List price in rupees before any offer, honouring admin overrides. Null = unknown product. */
export function basePrice(cfg: PricingConfig, productId: string, intl = false): number | null {
  const o = cfg.overrides[productId];
  if (productId === MYRA_ANDROID_ID) return o?.price ?? MYRA_ANDROID_BASE.price;
  const catalog = PRODUCT_PRICES[productId];
  if (!catalog) return null;
  if (intl && (o?.intl != null || INTERNATIONAL_PRICES[productId])) {
    return o?.intl ?? INTERNATIONAL_PRICES[productId];
  }
  return o?.price ?? catalog.price;
}

export interface Charge {
  base: number;
  price: number;
  discountPercent: number;
}

/** What to actually charge for a catalog product / MYRA Android right now. */
export function chargeFor(cfg: PricingConfig, productId: string, { intl = false, now = Date.now() } = {}): Charge | null {
  const base = basePrice(cfg, productId, intl);
  if (base == null) return null;
  const live = offerPhase(cfg.offer, now) === 'live' && offerApplies(cfg.offer, productId);
  return live
    ? { base, price: discountedPrice(base, cfg.offer.discountPercent), discountPercent: cfg.offer.discountPercent }
    : { base, price: base, discountPercent: 0 };
}

/** Same for a /products store item, whose list price lives on the product document. */
export function storeChargeFor(cfg: PricingConfig, listPrice: number, now = Date.now()): Charge {
  const live =
    listPrice > 0 && offerPhase(cfg.offer, now) === 'live' && offerApplies(cfg.offer, STORE_SCOPE);
  return live
    ? { base: listPrice, price: discountedPrice(listPrice, cfg.offer.discountPercent), discountPercent: cfg.offer.discountPercent }
    : { base: listPrice, price: listPrice, discountPercent: 0 };
}

/** Public shape for /api/pricing: both the list and the offer price, so the client can flip at the boundary. */
export function publicPricing(cfg: PricingConfig) {
  const o = cfg.offer;
  const prices: Record<string, { base: number; offer_price: number | null; intl_base: number | null; intl_offer_price: number | null }> = {};
  for (const p of MANAGED_PRODUCTS) {
    const base = basePrice(cfg, p.id, false)!;
    const intl = p.intl != null || cfg.overrides[p.id]?.intl != null ? basePrice(cfg, p.id, true) : null;
    const applies = offerApplies(o, p.id);
    prices[p.id] = {
      base,
      offer_price: applies ? discountedPrice(base, o.discountPercent) : null,
      intl_base: intl,
      intl_offer_price: applies && intl != null ? discountedPrice(intl, o.discountPercent) : null,
    };
  }
  return {
    server_time: new Date().toISOString(),
    offer: o.enabled
      ? {
          name: o.name,
          discount_percent: o.discountPercent,
          starts_at: o.startsAt,
          ends_at: o.endsAt,
          applies_to_store: offerApplies(o, STORE_SCOPE),
        }
      : null,
    prices,
  };
}
