"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { discountedPrice, offerPhase, type OfferConfig } from "@/lib/offers";

interface Row {
  id: string;
  name: string;
  default_price: number;
  default_intl: number | null;
  price: number | null;
  intl: number | null;
}

interface Loaded {
  products: Row[];
  offer: OfferConfig;
  store_scope: string;
}

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(path, { ...opts, headers: { "content-type": "application/json", ...(opts.headers || {}) } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.message || "Request failed");
  return json.data;
}

const IST_OFFSET_MS = 5.5 * 3600_000;
/** ISO instant -> "YYYY-MM-DDTHH:mm" in IST for <input type="datetime-local">. */
const toIstInput = (iso: string) => new Date(Date.parse(iso) + IST_OFFSET_MS).toISOString().slice(0, 16);
/** "YYYY-MM-DDTHH:mm" read as IST -> ISO instant. */
const fromIstInput = (v: string) => new Date(`${v}:00+05:30`).toISOString();

const input =
  "min-h-10 rounded-lg border border-white/15 bg-white/5 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400";

const PHASE_TEXT: Record<string, string> = {
  off: "The offer is off. Every product is at its normal price.",
  upcoming: "Scheduled. The site shows it as coming soon and prices drop automatically at the start time.",
  live: "Live now. The offer price is applied on the site and at checkout.",
  ended: "Ended. Prices are back to normal and the banner is hidden.",
};

const AdminPricingPage = () => {
  const router = useRouter();
  const { status } = useSession();
  const [data, setData] = useState<Loaded | null>(null);
  const [overrides, setOverrides] = useState<Record<string, { price: string; intl: string }>>({});
  const [offer, setOffer] = useState<{
    enabled: boolean;
    name: string;
    discountPercent: string;
    startsAt: string;
    endsAt: string;
    all: boolean;
    ids: string[];
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const d: Loaded = await api("/api/admin/pricing");
      setData(d);
      setOverrides(
        Object.fromEntries(d.products.map((p) => [p.id, { price: p.price != null ? String(p.price) : "", intl: p.intl != null ? String(p.intl) : "" }]))
      );
      setOffer({
        enabled: d.offer.enabled,
        name: d.offer.name,
        discountPercent: String(d.offer.discountPercent),
        startsAt: toIstInput(d.offer.startsAt),
        endsAt: toIstInput(d.offer.endsAt),
        all: d.offer.productIds == null,
        ids: d.offer.productIds ?? [...d.products.map((p) => p.id), d.store_scope],
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load pricing");
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") load();
  }, [status, router, load]);

  const pct = Number(offer?.discountPercent) || 0;
  const preview = useMemo(() => {
    if (!offer) return null;
    try {
      const cfg: OfferConfig = {
        enabled: offer.enabled,
        name: offer.name,
        discountPercent: pct,
        startsAt: fromIstInput(offer.startsAt),
        endsAt: fromIstInput(offer.endsAt),
        productIds: null,
      };
      return offerPhase(cfg, Date.now());
    } catch {
      return "off";
    }
  }, [offer, pct]);

  const save = async () => {
    if (!data || !offer) return;
    setSaving(true);
    try {
      const body = {
        overrides: Object.fromEntries(
          Object.entries(overrides).map(([id, v]) => [id, { price: v.price === "" ? null : Number(v.price), intl: v.intl === "" ? null : Number(v.intl) }])
        ),
        offer: {
          enabled: offer.enabled,
          name: offer.name,
          discountPercent: Number(offer.discountPercent),
          startsAt: fromIstInput(offer.startsAt),
          endsAt: fromIstInput(offer.endsAt),
          productIds: offer.all ? null : offer.ids,
        },
      };
      await api("/api/admin/pricing", { method: "PUT", body: JSON.stringify(body) });
      toast.success("Pricing saved. The site picks it up within a minute.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save pricing");
    } finally {
      setSaving(false);
    }
  };

  const toggleId = (id: string) =>
    setOffer((o) => (o ? { ...o, ids: o.ids.includes(id) ? o.ids.filter((x) => x !== id) : [...o.ids, id] } : o));

  if (!data || !offer) {
    return (
      <div className="license-admin min-h-screen">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-10 text-muted-foreground" role="status">
          <Loader2 className="animate-spin" size={18} /> Loading pricing
        </div>
      </div>
    );
  }

  return (
    <div className="license-admin min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Prices &amp; offers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set each product&apos;s price and schedule a site-wide discount. Times are Indian Standard Time. The offer starts and
          ends on its own, and prices return to normal afterwards.
        </p>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5" aria-labelledby="offer-h">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="offer-h" className="text-lg font-semibold">Scheduled offer</h2>
            <label className="flex min-h-10 items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={offer.enabled} onChange={(e) => setOffer({ ...offer, enabled: e.target.checked })} />
              Offer enabled
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Offer name</span>
              <input className={`${input} w-full`} maxLength={60} value={offer.name} onChange={(e) => setOffer({ ...offer, name: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Discount (%)</span>
              <input className={`${input} w-full`} type="number" min={1} max={90} value={offer.discountPercent} onChange={(e) => setOffer({ ...offer, discountPercent: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Starts (IST)</span>
              <input className={`${input} w-full`} type="datetime-local" value={offer.startsAt} onChange={(e) => setOffer({ ...offer, startsAt: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Ends (IST)</span>
              <input className={`${input} w-full`} type="datetime-local" value={offer.endsAt} onChange={(e) => setOffer({ ...offer, endsAt: e.target.value })} />
            </label>
          </div>

          <p className="mt-3 text-sm text-amber-300" aria-live="polite">{PHASE_TEXT[preview || "off"]}</p>

          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-medium">Applies to</legend>
            <label className="mb-2 flex min-h-9 items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={offer.all} onChange={(e) => setOffer({ ...offer, all: e.target.checked })} />
              Every product (including the /products store)
            </label>
            {!offer.all && (
              <div className="grid gap-1 sm:grid-cols-2">
                {data.products.map((p) => (
                  <label key={p.id} className="flex min-h-9 items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4" checked={offer.ids.includes(p.id)} onChange={() => toggleId(p.id)} />
                    {p.name}
                  </label>
                ))}
                <label className="flex min-h-9 items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4" checked={offer.ids.includes(data.store_scope)} onChange={() => toggleId(data.store_scope)} />
                  Store products (/products)
                </label>
              </div>
            )}
          </fieldset>
        </section>

        <section className="mt-6" aria-labelledby="prices-h">
          <h2 id="prices-h" className="text-lg font-semibold">Product prices</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Leave a price blank to use the default. Store products (/products) are priced on the Products tab of the main admin page; the offer
            applies on top of those prices too.
          </p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-white/5 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Product</th>
                  <th className="px-3 py-2.5 font-medium">Default</th>
                  <th className="px-3 py-2.5 font-medium">Price (₹)</th>
                  <th className="px-3 py-2.5 font-medium">International (₹)</th>
                  <th className="px-3 py-2.5 font-medium">With offer</th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((p) => {
                  const o = overrides[p.id] || { price: "", intl: "" };
                  const base = o.price !== "" ? Number(o.price) : p.default_price;
                  const applies = offer.all || offer.ids.includes(p.id);
                  return (
                    <tr key={p.id} className="border-t border-white/10">
                      <td className="px-3 py-3 font-medium">{p.name}</td>
                      <td className="px-3 py-3 text-muted-foreground">₹{p.default_price}</td>
                      <td className="px-3 py-3">
                        <input
                          className={`${input} w-28`}
                          type="number"
                          min={1}
                          placeholder={String(p.default_price)}
                          value={o.price}
                          onChange={(e) => setOverrides({ ...overrides, [p.id]: { ...o, price: e.target.value } })}
                          aria-label={`${p.name} price`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        {p.default_intl != null ? (
                          <input
                            className={`${input} w-28`}
                            type="number"
                            min={1}
                            placeholder={String(p.default_intl)}
                            value={o.intl}
                            onChange={(e) => setOverrides({ ...overrides, [p.id]: { ...o, intl: e.target.value } })}
                            aria-label={`${p.name} international price`}
                          />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {offer.enabled && applies && pct > 0 ? (
                          <span className="font-semibold text-emerald-300">₹{discountedPrice(base || 0, pct)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-6">
          <Button onClick={save} disabled={saving} className="min-h-11 px-8">
            {saving && <Loader2 size={16} className="mr-2 animate-spin" />}
            Save pricing
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminPricingPage;
