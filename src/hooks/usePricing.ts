"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MANAGED_PRODUCTS, discountedPrice, offerPhase, type OfferPhase } from "@/lib/offers";

interface ApiOffer {
  name: string;
  discount_percent: number;
  starts_at: string;
  ends_at: string;
  applies_to_store: boolean;
}

interface ApiPricing {
  server_time: string;
  offer: ApiOffer | null;
  prices: Record<string, { base: number; offer_price: number | null; intl_base: number | null; intl_offer_price: number | null }>;
}

export interface ProductPrice {
  /** What the buyer pays right now (offer applied while it is live). */
  price: number;
  /** List price before the offer. Equals `price` when no offer applies. */
  base: number;
  discounted: boolean;
  percent: number;
}

async function fetchPricing(): Promise<ApiPricing> {
  const res = await fetch("/api/pricing");
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error("pricing unavailable");
  return json.data as ApiPricing;
}

const MAX_TIMEOUT = 2 ** 31 - 1;

/**
 * Admin-managed prices and the scheduled site offer (Diwali sale etc.). Until the first response
 * lands (or if it fails) it falls back to the code's list prices with no offer, so a card never
 * shows a discount the server has not confirmed. The server still recomputes the charge at order time.
 */
export function usePricing() {
  const query = useQuery({
    queryKey: ["pricing"],
    queryFn: fetchPricing,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  // The server renders list prices (no data). Reading the cache only after mount keeps the first
  // client render identical to that HTML, so a response that lands mid-hydration cannot mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const data = mounted ? query.data : undefined;
  const isLoading = query.isLoading;

  // Server-corrected clock, so a wrong device clock cannot start or end the sale early.
  const skew = useMemo(() => (data ? Date.parse(data.server_time) - Date.now() : 0), [data]);
  const [tick, setTick] = useState(0);
  const now = Date.now() + skew;

  const offerCfg = useMemo(
    () =>
      data?.offer
        ? {
            enabled: true,
            name: data.offer.name,
            discountPercent: data.offer.discount_percent,
            startsAt: data.offer.starts_at,
            endsAt: data.offer.ends_at,
            productIds: null,
          }
        : null,
    [data]
  );
  // `tick` is read so the memo below re-runs when the boundary timer fires.
  const phase: OfferPhase = useMemo(() => offerPhase(offerCfg, now), [offerCfg, now, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flip the whole page at the exact start / end instant without a reload.
  useEffect(() => {
    if (!offerCfg) return;
    const start = Date.parse(offerCfg.startsAt);
    const end = Date.parse(offerCfg.endsAt);
    const t = Date.now() + skew;
    const next = t < start ? start : t < end ? end : null;
    if (next == null) return;
    const id = window.setTimeout(() => setTick((n) => n + 1), Math.min(MAX_TIMEOUT, Math.max(1000, next - t + 250)));
    return () => window.clearTimeout(id);
  }, [offerCfg, skew, phase]);

  const price = useCallback(
    (productId: string, intl = false): ProductPrice => {
      const entry = data?.prices[productId];
      const fallback = MANAGED_PRODUCTS.find((p) => p.id === productId);
      const base = entry
        ? intl && entry.intl_base != null
          ? entry.intl_base
          : entry.base
        : intl && fallback?.intl != null
          ? fallback.intl
          : fallback?.price ?? 0;
      const offerPrice = entry ? (intl && entry.intl_base != null ? entry.intl_offer_price : entry.offer_price) : null;
      if (phase === "live" && offerPrice != null && offerPrice < base) {
        return { price: offerPrice, base, discounted: true, percent: offerCfg?.discountPercent ?? 0 };
      }
      return { price: base, base, discounted: false, percent: 0 };
    },
    [data, phase, offerCfg]
  );

  /** Store (/products) items keep their list price on the product; the offer applies on top. */
  const storePrice = useCallback(
    (listPrice: number): ProductPrice => {
      if (phase === "live" && data?.offer?.applies_to_store && listPrice > 0 && offerCfg) {
        return { price: discountedPrice(listPrice, offerCfg.discountPercent), base: listPrice, discounted: true, percent: offerCfg.discountPercent };
      }
      return { price: listPrice, base: listPrice, discounted: false, percent: 0 };
    },
    [data, phase, offerCfg]
  );

  return {
    loading: isLoading,
    offer: offerCfg,
    phase,
    startsAt: offerCfg ? Date.parse(offerCfg.startsAt) : null,
    endsAt: offerCfg ? Date.parse(offerCfg.endsAt) : null,
    /** Server-corrected "now" for countdowns. */
    skew,
    price,
    storePrice,
  };
}
