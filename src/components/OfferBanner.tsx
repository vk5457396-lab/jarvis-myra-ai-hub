"use client";

import { useEffect, useState } from "react";
import Link from "@/components/IntentLink";
import { usePricing } from "@/hooks/usePricing";

const pad = (n: number) => String(n).padStart(2, "0");

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

const dateFmt = (ms: number) =>
  new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/** Diya: a clay lamp with a flame, drawn inline so it needs no asset and inherits no layout. */
function Diya({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="diya-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.5" stopColor="#ffb02e" />
          <stop offset="1" stopColor="#ff6a00" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="14" r="14" fill="url(#diya-glow)" opacity="0.7" />
      <path className="diya-flame" d="M32 2c4 5 6 8 6 12a6 6 0 0 1-12 0c0-4 2-7 6-12z" fill="#ffd43b" />
      <path d="M32 8c2 3 3 5 3 7a3 3 0 0 1-6 0c0-2 1-4 3-7z" fill="#fff6d6" />
      <path d="M6 24h52c0 12-10 22-26 22S6 36 6 24z" fill="#c2410c" />
      <path d="M6 24h52" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 32c6 5 30 5 36 0" stroke="#fbbf24" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

/**
 * Scheduled-offer banner. Before the start it announces the sale as coming soon with a countdown to
 * the start; while live it shows the countdown to the end; after the end (or when no offer is
 * configured) it renders nothing, and every price on the site is back to its list price.
 */
export default function OfferBanner({ className = "" }: { className?: string }) {
  const { offer, phase, startsAt, endsAt, skew } = usePricing();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now() + skew);
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [skew]);

  if (!offer || (phase !== "upcoming" && phase !== "live") || startsAt == null || endsAt == null) return null;

  const live = phase === "live";
  const target = live ? endsAt : startsAt;
  const left = parts(now == null ? target - Date.now() : target - now);
  const units = [
    { v: left.d, l: "Days" },
    { v: left.h, l: "Hours" },
    { v: left.m, l: "Mins" },
    { v: left.s, l: "Secs" },
  ];

  return (
    <section
      aria-label={`${offer.name} ${live ? "is live" : "coming soon"}`}
      className={`diwali-banner relative overflow-hidden rounded-3xl border border-amber-400/30 ${className}`}
    >
      <style>{`
        .diwali-banner{background:radial-gradient(120% 140% at 85% 0%,rgba(255,150,30,.30),transparent 55%),radial-gradient(90% 120% at 0% 100%,rgba(190,24,93,.30),transparent 60%),linear-gradient(160deg,#2a0a1d,#14081f 70%)}
        .diwali-rangoli{background:repeating-conic-gradient(from 0deg,rgba(251,191,36,.10) 0 10deg,transparent 10deg 20deg);-webkit-mask:radial-gradient(circle,#000 0,#000 38%,transparent 70%);mask:radial-gradient(circle,#000 0,#000 38%,transparent 70%)}
        @keyframes diya-flicker{0%,100%{transform:scale(1) translateY(0);opacity:1}50%{transform:scale(1.08,1.14) translateY(-1px);opacity:.88}}
        .diya-flame{transform-origin:32px 14px;animation:diya-flicker 1.6s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){.diya-flame{animation:none}}
      `}</style>

      <div className="diwali-rangoli pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full" aria-hidden="true" />
      <div className="pointer-events-none absolute right-4 top-4 flex items-end gap-2 opacity-90 sm:right-8 sm:top-6" aria-hidden="true">
        <Diya className="h-9 w-12 sm:h-11 sm:w-14" />
        <Diya className="h-7 w-9 sm:h-9 sm:w-12" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8">
        <div className="max-w-xl pr-16 sm:pr-24">
          <p className="inline-block rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
            {live ? "Live now" : "Coming soon"}
          </p>
          <h2 className="mt-3 font-display text-3xl font-black leading-tight text-amber-100 sm:text-4xl">
            {offer.name}: {offer.discountPercent}% off on every product
          </h2>
          <p className="mt-2 max-w-xl text-sm text-amber-100/80 sm:text-base">
            {live
              ? `The offer price is already applied on every card. Sale ends ${dateFmt(endsAt)}.`
              : `Starts ${dateFmt(startsAt)} and runs till ${dateFmt(endsAt)}. Prices drop automatically, nothing to claim.`}
          </p>
          <Link
            href="/pricing"
            className="mt-5 inline-flex min-h-11 items-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 font-display text-sm font-bold text-black transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            {live ? "Shop the sale" : "See prices"}
          </Link>
        </div>

        <div>
          <p className="mb-2 text-xs text-amber-100/70">{live ? "Sale ends in" : "Sale starts in"}</p>
          <div className="flex gap-2" role="timer" aria-live="off">
            {units.map((u) => (
              <div key={u.l} className="min-w-[3.6rem] rounded-xl border border-amber-300/25 bg-black/30 px-2 py-2 text-center">
                <span className="block font-display text-2xl font-black tabular-nums text-amber-200">{pad(u.v)}</span>
                <span className="text-[10px] text-amber-100/60">{u.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
