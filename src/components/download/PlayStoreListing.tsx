"use client";

import { useRef, useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, ChevronLeft, ChevronRight, Share2, X } from "lucide-react";
import { toast } from "sonner";

export type Shot = { src: string; alt: string; /** width / height */ ratio: number };
export type Stat = { value: ReactNode; label: string };

export interface ListingProps {
  id: string;
  icon: string;
  title: string;
  developer: string;
  /** Small grey line under the developer, e.g. "Lifetime purchase". */
  note?: string;
  stats: Stat[];
  /** The green primary action (Install / price), rendered by the caller so it owns the logic. */
  action: ReactNode;
  /** Short line under the action, e.g. how installs work. */
  actionHint?: ReactNode;
  shots: Shot[];
  about: string;
  tags: string[];
  updatedOn?: string | null;
  whatsNew?: string | null;
  /** Ratings & reviews section, rendered after "What's new". */
  reviews?: ReactNode;
  sidebar?: ReactNode;
}

/** Google Play's green primary button, dark theme. */
export const playButtonClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#6dd58c] px-10 text-[15px] font-semibold text-[#00210b] transition-colors hover:bg-[#85e0a0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6dd58c] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60 sm:w-auto sm:min-w-[200px]";

const SHOT_H = "h-[260px] sm:h-[320px] lg:h-[360px]";

function Screenshots({ shots, title }: { shots: Shot[]; title: string }) {
  const rail = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  const scrollBy = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: "smooth" });
  const step = (dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + shots.length) % shots.length));

  return (
    <div className="group/rail relative">
      <ul
        ref={rail}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={`${title} screenshots`}
      >
        {shots.map((s, i) => (
          <li key={s.src} className="shrink-0 snap-start">
            <button
              type="button"
              onClick={() => setOpen(i)}
              className={`block overflow-hidden rounded-lg border border-white/10 bg-[#1f1f1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6dd58c] ${SHOT_H}`}
              style={{ aspectRatio: String(s.ratio) }}
              aria-label={`Open screenshot ${i + 1}: ${s.alt}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={s.alt} loading={i < 3 ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover" />
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop arrows, like play.google.com */}
      {(["left", "right"] as const).map((side) => (
        <button
          key={side}
          type="button"
          onClick={() => scrollBy(side === "left" ? -1 : 1)}
          aria-label={side === "left" ? "Previous screenshots" : "Next screenshots"}
          className={`absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#2d2f31] text-[#e3e3e3] shadow-lg transition-opacity hover:bg-[#3c4043] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6dd58c] md:flex md:opacity-0 md:group-hover/rail:opacity-100 ${
            side === "left" ? "-left-5" : "-right-5"
          }`}
        >
          {side === "left" ? <ChevronLeft size={22} aria-hidden="true" /> : <ChevronRight size={22} aria-hidden="true" />}
        </button>
      ))}

      {/* Full-screen viewer */}
      <DialogPrimitive.Root open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[95] bg-black/90 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-[96] flex items-center justify-center p-4 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") step(1);
              if (e.key === "ArrowLeft") step(-1);
            }}
          >
            <DialogPrimitive.Title className="sr-only">{title} screenshot</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">Use the arrow keys to move between screenshots.</DialogPrimitive.Description>
            {open !== null && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shots[open].src} alt={shots[open].alt} className="max-h-[88vh] max-w-full rounded-xl object-contain" />
            )}
            <button type="button" onClick={() => step(-1)} aria-label="Previous screenshot" className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-8">
              <ChevronLeft size={26} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next screenshot" className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-8">
              <ChevronRight size={26} aria-hidden="true" />
            </button>
            <DialogPrimitive.Close aria-label="Close" className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <X size={22} aria-hidden="true" />
            </DialogPrimitive.Close>
            {open !== null && (
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70 tabular-nums">
                {open + 1} / {shots.length}
              </p>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}

/**
 * A Google-Play-style app listing (dark theme): icon + title + developer, stat strip, green action,
 * screenshot rail with a full-screen viewer, "About this app" and "What's new".
 */
export default function PlayStoreListing(p: ListingProps) {
  const share = async () => {
    const url = `${window.location.origin}/download#${p.id}`;
    try {
      if (navigator.share) await navigator.share({ title: p.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      // share sheet dismissed
    }
  };

  return (
    <article id={p.id} className="scroll-mt-24 text-[#e3e3e3]" aria-labelledby={`${p.id}-title`}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {/* Header */}
          <header className="flex flex-col-reverse gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 id={`${p.id}-title`} className="text-[2rem] font-medium leading-tight tracking-tight text-[#e3e3e3] sm:text-5xl">
                {p.title}
              </h2>
              <p className="mt-3 text-base font-medium text-[#6dd58c]">{p.developer}</p>
              {p.note && <p className="mt-1 text-xs text-[#c4c7c5]">{p.note}</p>}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.icon}
              alt=""
              width={96}
              height={96}
              className="h-[72px] w-[72px] shrink-0 rounded-[22%] shadow-[0_1px_3px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] sm:h-24 sm:w-24"
            />
          </header>

          {/* Stat strip */}
          <dl className="mt-6 flex max-w-full items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {p.stats.map((s, i) => (
              <div
                key={s.label}
                className={`flex min-w-[92px] shrink-0 flex-col items-center justify-center px-4 text-center first:pl-0 ${
                  i > 0 ? "border-l border-white/15" : ""
                }`}
              >
                <dd className="text-sm font-medium text-[#e3e3e3]">{s.value}</dd>
                <dt className="mt-0.5 text-xs text-[#c4c7c5]">{s.label}</dt>
              </div>
            ))}
          </dl>

          {/* Actions */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            {p.action}
            <button
              type="button"
              onClick={share}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-[#6dd58c] hover:bg-[#6dd58c]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6dd58c]"
            >
              <Share2 size={18} aria-hidden="true" /> Share
            </button>
          </div>
          {p.actionHint && <div className="mt-3 text-xs text-[#c4c7c5]">{p.actionHint}</div>}

          {/* Screenshots */}
          <div className="mt-9">
            <Screenshots shots={p.shots} title={p.title} />
          </div>

          {/* About */}
          <section className="mt-10" aria-labelledby={`${p.id}-about`}>
            <h3 id={`${p.id}-about`} className="flex items-center gap-3 text-xl font-medium text-[#e3e3e3]">
              About this app <ArrowRight size={20} className="text-[#c4c7c5]" aria-hidden="true" />
            </h3>
            <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-6 text-[#c4c7c5]">{p.about}</p>
            {p.updatedOn && (
              <div className="mt-5">
                <p className="text-sm font-medium text-[#e3e3e3]">Updated on</p>
                <p className="text-sm text-[#c4c7c5]">{p.updatedOn}</p>
              </div>
            )}
            <ul className="mt-5 flex flex-wrap gap-2">
              {p.tags.map((t) => (
                <li key={t} className="rounded-lg border border-white/20 px-4 py-1.5 text-sm text-[#e3e3e3]">
                  {t}
                </li>
              ))}
            </ul>
          </section>

          {p.whatsNew && (
            <section className="mt-10" aria-labelledby={`${p.id}-new`}>
              <h3 id={`${p.id}-new`} className="text-xl font-medium text-[#e3e3e3]">What&apos;s new</h3>
              <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-6 text-[#c4c7c5]">{p.whatsNew}</p>
            </section>
          )}

          {p.reviews}
        </div>

        {p.sidebar && <aside className="min-w-0 lg:pt-2">{p.sidebar}</aside>}
      </div>
    </article>
  );
}

/** "More by developer" row, as in Play's right rail. */
export function MoreByDeveloper({ items }: { items: { href: string; icon: string; title: string; subtitle: string }[] }) {
  return (
    <div>
      <h3 className="flex items-center gap-3 text-lg font-medium text-[#e3e3e3]">
        More by CodeNinjaVik <ArrowRight size={18} className="text-[#c4c7c5]" aria-hidden="true" />
      </h3>
      <ul className="mt-4 space-y-1">
        {items.map((it) => (
          <li key={it.href}>
            <a href={it.href} className="flex items-center gap-4 rounded-xl p-2 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6dd58c]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.icon} alt="" width={56} height={56} className="h-14 w-14 rounded-[22%]" loading="lazy" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-[#e3e3e3]">{it.title}</span>
                <span className="block truncate text-xs text-[#c4c7c5]">{it.subtitle}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
