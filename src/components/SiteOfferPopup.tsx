"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export interface SiteOffer {
  id: string;
  title: string;
  message: string;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  badge: string | null;
  updated_at?: string;
}

/** Seen-key includes updated_at so editing a live popup shows it again to people who closed the old copy. */
const seenKey = (o: SiteOffer) => `site_offer_seen:${o.id}:${o.updated_at ?? ""}`;

/** The popup card itself — shared by the live site popup and the admin preview. */
export function OfferCard({
  offer,
  onClose,
  onCta,
  preview = false,
}: {
  offer: SiteOffer;
  onClose?: () => void;
  onCta?: () => void;
  /** Render outside a Dialog (admin preview) — plain heading/paragraph instead of Radix Title/Description. */
  preview?: boolean;
}) {
  const Title = preview ? "h3" : DialogPrimitive.Title;
  const Description = preview ? "p" : DialogPrimitive.Description;
  const isExternal = !!offer.cta_url && /^https?:\/\//.test(offer.cta_url);
  const ctaClass =
    "inline-flex w-full items-center justify-center min-h-12 rounded-xl px-6 font-display font-bold text-white bg-primary hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card shadow-[0_30px_80px_-20px_hsl(var(--primary)/0.45)]">
      {offer.image_url ? (
        <div className="relative aspect-[16/9] bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={offer.image_url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card to-transparent" aria-hidden="true" />
        </div>
      ) : (
        <div className="h-2 bg-gradient-to-r from-primary via-secondary to-primary" aria-hidden="true" />
      )}

      <div className={`px-6 pb-6 sm:px-8 sm:pb-8 ${offer.image_url ? "-mt-6 relative" : "pt-7"}`}>
        {offer.badge && (
          <span className="inline-block rounded-lg bg-primary px-2.5 py-1 font-display text-sm font-extrabold text-white">
            {offer.badge}
          </span>
        )}
        <Title className="mt-3 font-display text-2xl sm:text-3xl font-extrabold leading-tight text-foreground text-balance">
          {offer.title}
        </Title>
        {offer.message ? (
          <Description className="mt-3 text-base leading-relaxed text-muted-foreground whitespace-pre-line">
            {offer.message}
          </Description>
        ) : (
          <Description className="sr-only">Current offer from CodeNinjaVik</Description>
        )}

        <div className="mt-6 space-y-2">
          {offer.cta_url && (
            isExternal ? (
              <a href={offer.cta_url} target="_blank" rel="noopener noreferrer" onClick={onCta} className={ctaClass}>
                {offer.cta_label || "View offer"}
              </a>
            ) : (
              <Link href={offer.cta_url} onClick={onCta} className={ctaClass}>
                {offer.cta_label || "View offer"}
              </Link>
            )
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-11 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Not now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Event/offer popup the admin publishes from the dashboard. Shown once per browser session when
 * someone opens the site (after the intro loader), never on admin pages.
 */
const SiteOfferPopup = ({ ready }: { ready: boolean }) => {
  const pathname = usePathname();
  const [offer, setOffer] = useState<SiteOffer | null>(null);
  const [open, setOpen] = useState(false);
  const onAdminPage = pathname?.startsWith("/admin");

  useEffect(() => {
    if (!ready || onAdminPage) return;
    let cancelled = false;
    fetch("/api/site-banner/active")
      .then((r) => r.json())
      .then((json) => {
        const o: SiteOffer | null = json?.success ? json.data.banner : null;
        if (cancelled || !o) return;
        try {
          if (sessionStorage.getItem(seenKey(o))) return;
        } catch {
          // storage blocked — still show it once for this page view
        }
        setOffer(o);
        setOpen(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Fetch once per visit, not on every client-side navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const close = () => {
    setOpen(false);
    if (offer) {
      try {
        sessionStorage.setItem(seenKey(offer), "1");
      } catch {
        // ignore
      }
    }
  };

  if (!offer) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 motion-reduce:animate-none" />
        <DialogPrimitive.Content
          // Focus the dialog itself on open (still trapped inside) so no button shows a focus ring
          // to mouse users; keyboard users Tab straight to the button.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement | null)?.focus();
          }}
          className="fixed left-1/2 top-1/2 z-[91] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:animate-none">
          <OfferCard offer={offer} onClose={close} onCta={close} />
          <DialogPrimitive.Close
            aria-label="Close offer"
            className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/75 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X size={18} aria-hidden="true" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default SiteOfferPopup;
