import { PRODUCT_PRICES, INTERNATIONAL_PRICES } from '@/lib/pricing';

/**
 * Shared (server + client) pricing-offer logic. The admin edits the offer on /admin/pricing; the
 * server charges with it (see pricingService.ts) and the site displays it (see usePricing.ts), both
 * through these same functions so the price a visitor sees is the price they pay.
 */

/** MYRA for Android lifetime plan - sold through /api/myra/website-purchase, not Razorpay catalog. */
export const MYRA_ANDROID_ID = 'myra_android';
/** Scope key for every product in the /products store (their prices live on the product itself). */
export const STORE_SCOPE = 'store';

export const MYRA_ANDROID_BASE = { price: 999, name: 'MYRA for Android (Lifetime)' };

/** Every product whose price the admin manages here, in display order. */
export const MANAGED_PRODUCTS: { id: string; name: string; price: number; intl: number | null }[] = [
  ...Object.entries(PRODUCT_PRICES).map(([id, p]) => ({
    id,
    name: p.name,
    price: p.price,
    intl: INTERNATIONAL_PRICES[id] ?? null,
  })),
  { id: MYRA_ANDROID_ID, name: MYRA_ANDROID_BASE.name, price: MYRA_ANDROID_BASE.price, intl: null },
];

export interface OfferConfig {
  enabled: boolean;
  name: string;
  discountPercent: number;
  /** ISO timestamps (absolute instants). */
  startsAt: string;
  endsAt: string;
  /** null = every product (catalog, MYRA Android and the store). */
  productIds: string[] | null;
}

/** Diwali 2026: 30% off from 1 Nov 00:00 IST until the end of 10 Nov IST. Admin can change it. */
export const DEFAULT_OFFER: OfferConfig = {
  enabled: true,
  name: 'Diwali Sale',
  discountPercent: 30,
  startsAt: '2026-11-01T00:00:00+05:30',
  endsAt: '2026-11-10T23:59:59+05:30',
  productIds: null,
};

export type OfferPhase = 'off' | 'upcoming' | 'live' | 'ended';

export function offerPhase(offer: OfferConfig | null | undefined, now: number): OfferPhase {
  if (!offer || !offer.enabled || !(offer.discountPercent > 0)) return 'off';
  const start = Date.parse(offer.startsAt);
  const end = Date.parse(offer.endsAt);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 'off';
  if (now < start) return 'upcoming';
  if (now >= end) return 'ended';
  return 'live';
}

export function offerApplies(offer: OfferConfig | null | undefined, productId: string): boolean {
  if (!offer) return false;
  return offer.productIds == null || offer.productIds.includes(productId);
}

/** Whole-rupee discounted price (Razorpay amounts are integer paise, so never a fractional rupee). */
export function discountedPrice(price: number, percent: number): number {
  const pct = Math.min(90, Math.max(0, percent));
  return Math.max(1, Math.round((price * (100 - pct)) / 100));
}
