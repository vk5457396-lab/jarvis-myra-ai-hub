"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Row = { product_type: string; count: number; source: string };
type Offline = { jarvis: number; myra: number; bundle: number; other: number };

const OFFLINE_FIELDS: { key: keyof Offline; label: string }[] = [
  { key: "jarvis", label: "Jarvis sales" },
  { key: "myra", label: "MYRA sales" },
  { key: "bundle", label: "Bundle sales" },
  { key: "other", label: "Other sales (product not known)" },
];

const SOURCE_LABEL: Record<string, string> = {
  purchases: "Website checkouts",
  myra_website: "MYRA Android (website)",
  marketplace: "Marketplace downloads",
};

const fieldClass =
  "w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm tabular-nums focus:outline-none focus:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/30";

/**
 * Admin: shows what the homepage sales counter counts automatically, and lets the admin add real
 * sales that happened outside this website (Telegram, direct UPI, in-app, before the site existed).
 */
const SalesCounterSettings = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [offline, setOffline] = useState<Offline>({ jarvis: 0, myra: 0, bundle: 0, other: 0 });
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/sales-counter");
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Could not load sales counter");
        setRows(json.data.rows);
        setOffline(json.data.offline);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not load sales counter");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const counted = rows.filter((r) => r.source !== "offline");
  const bySource = counted.reduce<Record<string, number>>((acc, r) => {
    acc[r.source] = (acc[r.source] || 0) + r.count;
    return acc;
  }, {});
  const countedTotal = counted.reduce((s, r) => s + r.count, 0);
  const offlineTotal = offline.jarvis + offline.myra + offline.bundle + offline.other;

  /** Sets "Other" so the homepage total equals the number the admin knows is right. */
  const applyTarget = () => {
    const t = Math.floor(Number(target));
    const knownWithoutOther = countedTotal + offline.jarvis + offline.myra + offline.bundle;
    if (!Number.isFinite(t) || t < knownWithoutOther) {
      toast.error(`Total can't be less than the ${knownWithoutOther} sales already counted`);
      return;
    }
    setOffline((o) => ({ ...o, other: t - knownWithoutOther }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/sales-counter", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(offline),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Could not save");
      toast.success("Sales counter updated. The homepage shows it within a few minutes.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof Offline) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setOffline((o) => ({ ...o, [k]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }));

  return (
    <form onSubmit={save} className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="font-display font-bold text-foreground flex items-center gap-2 mb-1">
        <BarChart3 size={18} className="text-primary" aria-hidden="true" /> Homepage sales counter
      </h2>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" aria-label="Loading" /></div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Counted automatically: <span className="font-bold text-foreground tabular-nums">{countedTotal}</span>
            {Object.keys(bySource).length > 0 && (
              <> ({Object.entries(bySource).map(([s, n]) => `${SOURCE_LABEL[s] || s}: ${n}`).join(", ")})</>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-3 mb-3">
            Add real sales the website never recorded — Telegram, direct UPI, in-app or before this site. Enter actual numbers only; they appear publicly on the homepage.
          </p>
          <div className="flex flex-wrap items-end gap-2 mb-4">
            <div>
              <label htmlFor="sales-target" className="block text-xs text-foreground mb-1.5">Set total to</label>
              <input
                id="sales-target"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="600"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className={`${fieldClass} w-32`}
              />
            </div>
            <Button type="button" variant="outline" onClick={applyTarget} className="min-h-11 rounded-xl">
              Fill "Other" to match
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.4fr_auto] lg:items-end">
            {OFFLINE_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label htmlFor={`offline-${key}`} className="block text-xs text-foreground mb-1.5">{label}</label>
                <input id={`offline-${key}`} type="number" inputMode="numeric" min={0} value={offline[key]} onChange={set(key)} className={fieldClass} />
              </div>
            ))}
            <Button type="submit" disabled={saving} className="min-h-11 rounded-xl font-display font-bold">
              {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : "Save"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Homepage total after saving: <span className="font-bold text-foreground tabular-nums">{countedTotal + offlineTotal}</span>
          </p>
        </>
      )}
    </form>
  );
};

export default SalesCounterSettings;
