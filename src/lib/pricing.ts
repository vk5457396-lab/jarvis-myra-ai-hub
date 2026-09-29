/**
 * Single source of truth for Razorpay product prices (whole rupees). /api/payments/create-order charges
 * these, and the pricing page displays them, so the price a visitor sees is the price they pay.
 */
export const PRODUCT_PRICES: Record<string, { price: number; name: string }> = {
  jarvis: { price: 899, name: 'Jarvis 2.0' },
  myra: { price: 899, name: 'MYRA 2.0' },
  myra_activation: { price: 799, name: 'MYRA 2.0 Activation Key (Lifetime)' },
  aria: { price: 899, name: 'ARIA 1.0' },
  bundle_jarvis_myra: { price: 1599, name: 'Jarvis 2.0 + MYRA 2.0 Bundle' },
  source_jarvis: { price: 3900, name: 'Jarvis 2.0 Source Code' },
  source_myra: { price: 3900, name: 'MYRA 2.0 Source Code' },
  source_aria: { price: 3900, name: 'ARIA 1.0 Source Code' },
  source_bundle: { price: 6999, name: 'Jarvis 2.0 + MYRA 2.0 Source Code Bundle' },
};

/** What buyers outside India are charged, still in rupees (Razorpay converts on their card). */
export const INTERNATIONAL_PRICES: Record<string, number> = {
  jarvis: 1299,
  myra: 1299,
  myra_activation: 1155,
  aria: 1299,
  bundle_jarvis_myra: 2299,
  source_jarvis: 3499,
  source_myra: 3499,
  source_aria: 3499,
  source_bundle: 4999,
};

/** Rupee amount charged for a product, matching create-order's choice. */
export function chargedInr(productId: string, isInternational: boolean): number {
  const base = PRODUCT_PRICES[productId]?.price ?? 0;
  return isInternational && INTERNATIONAL_PRICES[productId] ? INTERNATIONAL_PRICES[productId] : base;
}
