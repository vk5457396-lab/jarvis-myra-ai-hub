"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Star, Trash2 } from "lucide-react";

type App = "myra-android" | "myra-pc";

interface ReviewRow {
  id: string;
  name: string;
  rating: number;
  text: string;
  verified: boolean;
  hidden: boolean;
  created_at: string;
}

interface Summary {
  count: number;
  average: number;
  distribution: Record<string, number>;
}

const APPS: { id: App; label: string }[] = [
  { id: "myra-android", label: "MYRA Android" },
  { id: "myra-pc", label: "MYRA PC" },
];

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(path, { ...opts, headers: { "content-type": "application/json", ...(opts.headers || {}) } });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Request failed");
  return json.data;
}

const Stars = ({ n }: { n: number }) => (
  <span className="inline-flex" aria-label={`${n} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} size={14} strokeWidth={0} fill="currentColor" className={i <= n ? "text-amber-400" : "text-white/15"} />
    ))}
  </span>
);

const ReviewsAdminPage = () => {
  const router = useRouter();
  const { status } = useSession();
  const authGate = status === "unauthenticated" ? "out" : "in";
  const [app, setApp] = useState<App>("myra-android");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(`/api/admin/reviews?app=${app}`);
      setSummary(data.summary);
      setReviews(data.reviews);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [app]);

  useEffect(() => {
    if (authGate === "out") { router.push("/login"); return; }
    load();
  }, [authGate, router, load]);

  const toggleHidden = async (r: ReviewRow) => {
    setBusyId(r.id);
    try {
      await api(`/api/admin/reviews/${r.id}`, { method: "PATCH", body: JSON.stringify({ hidden: !r.hidden }) });
      toast.success(r.hidden ? "Review is visible again" : "Review hidden from the public page");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update review");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (r: ReviewRow) => {
    if (!confirm(`Delete ${r.name}'s review? This can't be undone.`)) return;
    setBusyId(r.id);
    try {
      await api(`/api/admin/reviews/${r.id}`, { method: "DELETE" });
      toast.success("Review deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete review");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="license-admin min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Ratings &amp; Reviews</h1>
          <p className="text-sm text-muted-foreground">
            Moderate what customers posted. Hidden reviews are removed from the public list and the average.
          </p>
        </div>

        <div className="mb-6 flex gap-2" role="tablist">
          {APPS.map((a) => (
            <Button key={a.id} role="tab" aria-selected={app === a.id} variant={app === a.id ? "default" : "outline"} onClick={() => setApp(a.id)}>
              {a.label}
            </Button>
          ))}
        </div>

        {summary && (
          <div className="license-glass mb-6 flex flex-wrap items-center gap-6 p-5">
            <div>
              <p className="text-4xl font-semibold">{summary.count ? summary.average.toFixed(1) : "–"}</p>
              <Stars n={Math.round(summary.average)} />
              <p className="mt-1 text-xs text-muted-foreground">
                {summary.count} public {summary.count === 1 ? "review" : "reviews"}
              </p>
            </div>
            <div className="min-w-[200px] flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = summary.distribution[String(n)] ?? 0;
                return (
                  <div key={n} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-3">{n}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${summary.count ? (c / summary.count) * 100 : 0}%` }} />
                    </div>
                    <span className="w-6 text-right">{c}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="license-glass p-8 text-center text-sm text-muted-foreground">No reviews yet for this app.</p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className={`license-glass flex items-start justify-between gap-4 p-4 ${r.hidden ? "opacity-60" : ""}`}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.name}</span>
                    <Stars n={r.rating} />
                    {r.verified && <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-400">Verified</span>}
                    {r.hidden && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">Hidden</span>}
                  </div>
                  {r.text && <p className="mt-1 break-words text-sm text-muted-foreground">{r.text}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="icon" disabled={busyId === r.id} onClick={() => toggleHidden(r)} title={r.hidden ? "Show" : "Hide"} aria-label={r.hidden ? "Show review" : "Hide review"}>
                    {r.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" disabled={busyId === r.id} onClick={() => remove(r)} title="Delete" aria-label="Delete review" className="text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ReviewsAdminPage;
