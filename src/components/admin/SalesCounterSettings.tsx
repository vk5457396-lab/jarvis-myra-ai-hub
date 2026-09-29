"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Row = { product_type: string; count: number; source: string };
type Offline = { jarvis: number; myra: number; bundle: number };

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
  const [offline, setOffline] = useState<Offline>({ jarvis: 0, myra: 0, bundle: 0 });
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
  const offlineTotal = offline.jarvis + offline.myra + offline.bundle;

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
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
            {(["jarvis", "myra", "bundle"] as const).map((k) => (
              <div key={k}>
                <label htmlFor={`offline-${k}`} className="block text-xs text-foreground mb-1.5">
                  {k === "jarvis" ? "Jarvis sales" : k === "myra" ? "MYRA sales" : "Bundle sales"}
                </label>
                <input id={`offline-${k}`} type="number" inputMode="numeric" min={0} value={offline[k]} onChange={set(k)} className={fieldClass} />
              </div>
            ))}
            <Button type="submit" disabled={saving} className="min-h-11 rounded-xl font-display font-bold">
              {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : "Save"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Homepage total: <span className="font-bold text-foreground tabular-nums">{countedTotal + offlineTotal}</span>
          </p>
        </>
      )}
    </form>
  );
};

export default SalesCounterSettings;
