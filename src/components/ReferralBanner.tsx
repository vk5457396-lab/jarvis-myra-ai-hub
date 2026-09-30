"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Gift } from "lucide-react";
import { getStoredReferralCode } from "@/lib/referral";

/**
 * "X invited you" pill. Signed in: shows the referrer the account is bound to, on every visit, for as
 * long as they use that account (and binds the account to the stored ?ref code if it has none yet).
 * Signed out: shows whoever owns the ?ref / saved code. Dismissing hides it for this page view only.
 */
const ReferralBanner = () => {
  const searchParams = useSearchParams();
  const { status, data: session } = useSession();
  const reduceMotion = useReducedMotion();
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const refCode = searchParams.get("ref");

  useEffect(() => {
    if (refCode) {
      try {
        localStorage.setItem("referral_code", refCode);
      } catch {
        // storage blocked — the URL param still works for this visit
      }
    }
  }, [refCode]);

  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;
    const code = getStoredReferralCode();
    // Remembered for the browser session so every page view doesn't call the API again. The key
    // changes with the account and the ref code, so a new link or login still refetches.
    const cacheKey = `ref-banner:${session?.user?.email || "anon"}:${code || ""}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached !== null) {
        setReferrerName(cached || null);
        return;
      }
    } catch {
      // storage blocked — fetch below
    }

    const load = async () => {
      try {
        let res: Response;
        if (status === "authenticated") {
          res = await fetch("/api/referrals/me", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ code }),
          });
        } else {
          if (!code) return setReferrerName(null);
          res = await fetch(`/api/referrals/lookup?code=${encodeURIComponent(code)}`);
        }
        const json = await res.json();
        const name: string | null = json.success ? json.data.referrer?.full_name || null : null;
        try {
          if (json.success) sessionStorage.setItem(cacheKey, name || "");
        } catch {
          // ignore
        }
        if (!cancelled) setReferrerName(name);
      } catch {
        // banner is non-essential — fail silently
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [status, refCode, session?.user?.email]);

  const visible = Boolean(referrerName) && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { y: -24, opacity: 0 }}
          animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { y: -24, opacity: 0, transition: { duration: 0.15 } }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-16 md:top-20 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
        >
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-auto flex items-center gap-3 pl-4 pr-1 py-1 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-primary/20 border border-emerald-500/30 backdrop-blur-xl shadow-lg shadow-emerald-500/10 max-w-md"
          >
            <Gift className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
            <p className="text-sm text-foreground">
              Invited by <span className="font-bold text-emerald-400">{referrerName}</span>
            </p>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Hide invite banner"
              className="ml-auto shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReferralBanner;
