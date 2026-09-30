"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const logo = "/assets/logo.png";

/** Brand gradient used for the curved panel and accents (swap here to re-colour both auth pages). */
export const PANEL_BG = "linear-gradient(150deg, hsl(0 78% 56%) 0%, hsl(0 72% 46%) 45%, hsl(350 68% 34%) 100%)";

export const pillInput =
  "w-full h-12 rounded-full bg-[#fdecec] px-5 text-[15px] text-neutral-900 placeholder:text-neutral-500/80 outline-none ring-0 transition-shadow focus:bg-white focus:shadow-[0_0_0_2px_hsl(0_72%_51%)]";

export const fieldLabel = "mb-1.5 block pl-4 text-xs font-medium text-neutral-600";

export const primaryButton =
  "inline-flex min-h-11 min-w-[10rem] items-center justify-center gap-2 rounded-full px-10 text-sm font-bold tracking-wider text-white shadow-[0_12px_24px_-10px_hsl(0_72%_46%)] transition-[filter,transform] hover:brightness-110 active:brightness-95 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(0_72%_51%)] focus-visible:ring-offset-2";

export const eyeButton =
  "absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(0_72%_51%)]";

export const googleButton =
  "flex min-h-11 w-full items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(0_72%_51%)]";

export function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/** Fade-and-rise entrance, skipped for reduced motion. */
export function useRise() {
  const reduceMotion = useReducedMotion();
  return (delay: number) =>
    reduceMotion
      ? {}
      : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const } };
}

type Props = {
  /** Big heading on the coloured panel (desktop only). */
  panelTitle: string;
  panelText: string;
  /** Outline button on the panel that switches to the other auth page. */
  panelCta: { href: string; label: string };
  /** Put the coloured panel on the right (sign-up), like the reference's mirrored screen. */
  mirrored?: boolean;
  children: ReactNode;
};

/**
 * Split auth card: curved brand panel beside a white form. On phones it stacks with a compact
 * curved panel on top, so the form stays the focus on small screens.
 */
export default function AuthSplitCard({ panelTitle, panelText, panelCta, mirrored = false, children }: Props) {
  const reduceMotion = useReducedMotion();
  const rise = useRise();

  return (
    <main className="flex justify-center px-4 pb-16 pt-24 md:pb-24 md:pt-36">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-white shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)] md:grid md:max-w-4xl ${
          mirrored ? "md:grid-cols-[1fr_1.05fr]" : "md:grid-cols-[1.05fr_1fr]"
        }`}
      >
        {/* ── Coloured panel: curved inner edge on desktop, curved bottom on phones ── */}
        <section
          className={`relative flex flex-col items-center justify-center px-8 pb-14 pt-10 text-center md:min-h-[580px] md:pb-10 ${
            mirrored ? "md:order-2 md:pl-20" : "md:pr-20"
          }`}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 md:hidden"
            style={{ background: PANEL_BG, [mirrored ? "borderBottomLeftRadius" : "borderBottomRightRadius"]: "55% 38%" }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 hidden md:block"
            style={{ background: PANEL_BG, clipPath: mirrored ? "ellipse(100% 96% at 100% 50%)" : "ellipse(100% 96% at 0% 50%)" }}
          />
          <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

          <div className="relative">
            <motion.div {...rise(0.1)} className="flex flex-col items-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="" className="h-12 w-12 rounded-full object-cover" />
              </span>
              <span className="mt-2 font-display text-lg font-bold tracking-wide text-white">codeninjavik</span>
            </motion.div>
            {/* Desktop copy — the phone layout keeps the panel compact, like the reference */}
            <div className="hidden md:block">
              <motion.h2 {...rise(0.18)} className="mt-10 font-display text-4xl font-bold text-white">
                {panelTitle}
              </motion.h2>
              <motion.p {...rise(0.24)} className="mx-auto mt-3 max-w-[16rem] text-sm leading-relaxed text-white/85">
                {panelText}
              </motion.p>
              <motion.div {...rise(0.3)} className="mt-10">
                <Link
                  href={panelCta.href}
                  className="inline-flex min-h-11 min-w-[14rem] items-center justify-center rounded-full border-2 border-white/80 px-8 text-sm font-semibold tracking-wider text-white transition-colors hover:bg-white hover:text-[hsl(0_72%_46%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {panelCta.label}
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Decorative corner swoosh on the form side (reference: curve in the far corner) */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -top-14 hidden h-32 w-32 rounded-full md:block ${mirrored ? "-left-14" : "-right-14"}`}
          style={{ background: PANEL_BG }}
        />

        {/* ── Form ── */}
        <section className={`relative px-7 pb-10 pt-4 md:flex md:flex-col md:justify-center md:px-12 md:pb-12 md:pt-20 ${mirrored ? "md:order-1" : ""}`}>
          {children}
        </section>
      </motion.div>
    </main>
  );
}
