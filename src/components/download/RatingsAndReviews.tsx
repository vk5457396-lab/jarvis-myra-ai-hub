"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

export type ReviewApp = "myra-android" | "myra-pc";
type Review = { id: string; name: string; rating: number; text: string; verified: boolean; created_at: string };
type Summary = { count: number; average: number; distribution: Record<string, number> };

/** Loads the public rating summary + reviews for one app; shared by the stat strip and the section. */
export function useReviews(app: ReviewApp) {
  const { status } = useSession();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [mine, setMine] = useState<Review | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  // Public list is CDN-cached; `fresh` adds a cache-buster right after the user posts/deletes so
  // their change shows immediately instead of after the cache window.
  const load = useCallback(
    async (offset = 0, fresh = false) => {
      try {
        const res = await fetch(`/api/reviews?app=${app}&offset=${offset}${fresh ? `&v=${Date.now()}` : ""}`);
        const json = await res.json();
        if (!json.success) return;
        setSummary(json.data.summary);
        setHasMore(json.data.has_more);
        setReviews((prev) => (offset ? [...prev, ...json.data.reviews] : json.data.reviews));
      } finally {
        setLoading(false);
      }
    },
    [app]
  );

  // The caller's own review is private — only fetched when signed in.
  const loadMine = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?app=${app}&mine=1`);
      const json = await res.json();
      if (json.success) setMine(json.data.mine);
    } catch {
      // non-essential
    }
  }, [app]);

  useEffect(() => {
    load(0);
  }, [load]);

  useEffect(() => {
    if (status === "authenticated") loadMine();
    else if (status === "unauthenticated") setMine(null);
  }, [status, loadMine]);

  return {
    summary,
    reviews,
    mine,
    hasMore,
    loading,
    reload: async () => {
      await Promise.all([load(0, true), loadMine()]);
    },
    loadMore: () => load(reviews.length),
    setSummary,
  };
}

export type ReviewsState = ReturnType<typeof useReviews>;

function Stars({ value, size = 14, className = "" }: { value: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }} aria-hidden="true">
            <Star size={size} className="absolute inset-0 text-white/25" fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="text-[#6dd58c]" fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

const AVATAR_COLORS = ["#8ab4f8", "#f28b82", "#fdd663", "#81c995", "#c58af9", "#78d9ec", "#fcad70"];
const avatarColor = (name: string) => AVATAR_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

function ReviewCard({ r, onAdminDelete }: { r: Review; onAdminDelete?: () => void }) {
  return (
    <li className="py-5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium text-[#202124]"
          style={{ background: avatarColor(r.name) }}
          aria-hidden="true"
        >
          {r.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 truncate text-sm text-[#e3e3e3]">{r.name}</span>
        {r.verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#6dd58c]/10 px-2 py-0.5 text-[11px] text-[#6dd58c]">
            <BadgeCheck size={12} aria-hidden="true" /> Verified purchase
          </span>
        )}
        {onAdminDelete && (
          <button
            type="button"
            onClick={onAdminDelete}
            aria-label={`Remove review by ${r.name}`}
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full text-[#c4c7c5] hover:bg-white/10 hover:text-red-300"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Stars value={r.rating} size={12} />
        <span className="text-xs text-[#c4c7c5]">{fmtDate(r.created_at)}</span>
      </div>
      {r.text && <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-6 text-[#c4c7c5]">{r.text}</p>}
    </li>
  );
}

/**
 * Google-Play-style "Ratings and reviews": real reviews from MongoDB, visible to everyone. Signed-in
 * users can post one review per app (and edit or delete it); MYRA for Android needs a purchase.
 */
export default function RatingsAndReviews({
  app,
  appName,
  state,
  canReview,
  cannotReviewReason,
}: {
  app: ReviewApp;
  appName: string;
  state: ReviewsState;
  /** Whether the signed-in user may post (e.g. bought MYRA). Undefined while unknown. */
  canReview?: boolean;
  cannotReviewReason?: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { summary, reviews, mine, hasMore, loading } = state;
  const [draftRating, setDraftRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const isAdmin = session?.user?.role === "admin";

  const startEdit = (rating: number) => {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    setDraftRating(rating);
    setText(mine?.text ?? "");
    setEditing(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftRating) {
      toast.error("Choose a star rating");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ app, rating: draftRating, text }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Could not post review");
      toast.success(mine ? "Review updated" : "Review posted");
      setEditing(false);
      await state.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post review");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id?: string) => {
    const res = await fetch(`/api/reviews?app=${app}${id ? `&id=${id}` : ""}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok || !json.success) {
      toast.error(json.message || "Could not remove review");
      return;
    }
    toast.success("Review removed");
    await state.reload();
  };

  const total = summary?.count ?? 0;
  const shown = hover || draftRating;

  return (
    <section className="mt-10" aria-labelledby={`${app}-reviews`}>
      <h3 id={`${app}-reviews`} className="flex items-center gap-3 text-xl font-medium text-[#e3e3e3]">
        Ratings and reviews <ArrowRight size={20} className="text-[#c4c7c5]" aria-hidden="true" />
      </h3>
      <p className="mt-1 text-xs text-[#c4c7c5]">
        {app === "myra-android" ? "Reviews are from people who bought MYRA." : "Reviews are from signed-in CodeNinjaVik users."}
      </p>

      {loading ? (
        <div className="flex py-10" aria-busy="true"><Loader2 className="animate-spin text-[#c4c7c5]" aria-label="Loading reviews" /></div>
      ) : (
        <>
          {/* Summary */}
          {total > 0 ? (
            <div className="mt-5 flex items-center gap-8">
              <div className="text-center">
                <p className="text-6xl font-normal leading-none text-[#e3e3e3] tabular-nums">{summary!.average.toFixed(1)}</p>
                <Stars value={summary!.average} size={14} className="mt-2" />
                <p className="mt-1 text-xs text-[#c4c7c5]">{total.toLocaleString("en-IN")} {total === 1 ? "review" : "reviews"}</p>
              </div>
              <div className="flex-1 max-w-sm space-y-1.5">
                {[5, 4, 3, 2, 1].map((s) => {
                  const n = summary!.distribution[String(s)] || 0;
                  return (
                    <div key={s} className="flex items-center gap-3 text-xs text-[#c4c7c5]">
                      <span className="w-2 tabular-nums">{s}</span>
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                        <span className="block h-full rounded-full bg-[#6dd58c]" style={{ width: `${(n / total) * 100}%` }} />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-[#c4c7c5]">No reviews yet. Be the first to rate {appName}.</p>
          )}

          {/* Rate / your review */}
          <div className="mt-8 max-w-2xl">
            {mine && !editing ? (
              <div className="rounded-2xl border border-white/10 p-5">
                <p className="text-sm font-medium text-[#e3e3e3]">Your review</p>
                <div className="mt-2 flex items-center gap-2">
                  <Stars value={mine.rating} size={14} />
                  <span className="text-xs text-[#c4c7c5]">{fmtDate(mine.created_at)}</span>
                </div>
                {mine.text && <p className="mt-2 text-sm text-[#c4c7c5]">{mine.text}</p>}
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => startEdit(mine.rating)} className="min-h-11 rounded-lg px-3 text-sm font-medium text-[#6dd58c] hover:bg-[#6dd58c]/10">
                    Edit your review
                  </button>
                  <button type="button" onClick={() => remove()} className="min-h-11 rounded-lg px-3 text-sm text-[#c4c7c5] hover:bg-white/10">
                    Delete
                  </button>
                </div>
              </div>
            ) : session?.user && canReview === false ? (
              <p className="rounded-2xl border border-white/10 p-5 text-sm text-[#c4c7c5]">{cannotReviewReason}</p>
            ) : (
              <form onSubmit={submit} className="rounded-2xl border border-white/10 p-5">
                <p className="text-sm font-medium text-[#e3e3e3]">Rate this app</p>
                <p className="text-xs text-[#c4c7c5]">Tell others what you think</p>
                <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      aria-checked={draftRating === i}
                      aria-label={`${i} star${i > 1 ? "s" : ""}`}
                      onMouseEnter={() => setHover(i)}
                      onClick={() => (editing ? setDraftRating(i) : startEdit(i))}
                      className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6dd58c]"
                    >
                      <Star size={30} strokeWidth={1.5} className={i <= shown ? "text-[#6dd58c]" : "text-[#c4c7c5]"} fill={i <= shown ? "currentColor" : "none"} aria-hidden="true" />
                    </button>
                  ))}
                </div>
                {editing && (
                  <>
                    <label htmlFor={`${app}-review-text`} className="sr-only">Your review</label>
                    <textarea
                      id={`${app}-review-text`}
                      rows={3}
                      maxLength={500}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Describe your experience (optional)"
                      className="mt-3 w-full resize-y rounded-lg border border-white/15 bg-transparent px-3 py-2.5 text-sm text-[#e3e3e3] placeholder:text-[#8e918f] focus:border-[#6dd58c] focus:outline-none"
                    />
                    <div className="mt-1 text-right text-xs text-[#8e918f] tabular-nums">{text.length}/500</div>
                    <div className="mt-2 flex justify-end gap-2">
                      <button type="button" onClick={() => setEditing(false)} className="min-h-11 rounded-lg px-4 text-sm font-medium text-[#6dd58c] hover:bg-[#6dd58c]/10">
                        Cancel
                      </button>
                      <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#6dd58c] px-5 text-sm font-semibold text-[#00210b] hover:bg-[#85e0a0] disabled:opacity-60">
                        {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} Post
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <ul className="mt-4 max-w-2xl divide-y divide-white/10">
              {reviews.map((r) => (
                <ReviewCard key={r.id} r={r} onAdminDelete={isAdmin ? () => remove(r.id) : undefined} />
              ))}
            </ul>
          )}
          {hasMore && (
            <button type="button" onClick={state.loadMore} className="mt-2 min-h-11 rounded-lg px-3 text-sm font-medium text-[#6dd58c] hover:bg-[#6dd58c]/10">
              See more reviews
            </button>
          )}
        </>
      )}
    </section>
  );
}

export { Stars };
