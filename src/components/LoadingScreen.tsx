"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";

// WebGL particles load as their own chunk (shared with the hero core's three.js); the CSS glow,
// name and progress below paint immediately so the intro never waits on it.
const LoaderParticles = dynamic(() => import("@/components/home/LoaderParticles"), { ssr: false, loading: () => null });

const BRAND = "CODENINJAVIK".split("");

/** Long enough for the waveform → core fold to play, never longer than MAX_MS (from navigation). */
const MIN_MS = 1500;
const MAX_MS = 3000;
const BURST_MS = 450;

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

/** Fired once the intro has fully exited, so heavy visuals (the hero's WebGL core) start only then. */
export const INTRO_DONE_EVENT = "cnv:intro-done";

function announceIntroDone() {
  (window as unknown as { __cnvIntroDone?: boolean }).__cnvIntroDone = true;
  window.dispatchEvent(new Event(INTRO_DONE_EVENT));
}

/** True once the intro has finished (or immediately if it already did earlier in this page view). */
export function isIntroDone(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as { __cnvIntroDone?: boolean }).__cnvIntroDone;
}

/**
 * Site intro: particles form a live voice waveform, fold into the rotating voice core, then burst
 * toward the viewer as the site appears. Progress follows the real page load, clamped to
 * MIN_MS..MAX_MS from navigation. Name + progress are CSS so they show before hydration.
 */
const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const doneRef = useRef(false);
  // The intro waits for the particle core to finish forming (MAX_MS still caps it).
  const formedRef = useRef(false);

  useEffect(() => {
    setHydrated(true);
    let loaded = document.readyState === "complete";
    const onLoad = () => {
      loaded = true;
    };
    window.addEventListener("load", onLoad);

    let raf = 0;
    let shown = 0;
    let burstTimer: ReturnType<typeof setTimeout> | undefined;
    // performance.now() counts from navigation start, so the limits hold even on slow hydration.
    const tick = (now: number) => {
      const ready = (loaded && now >= MIN_MS && formedRef.current) || now >= MAX_MS;
      const target = ready ? 100 : Math.min(90, (now / MAX_MS) * 100 + 10);
      shown += (target - shown) * (ready ? 0.25 : 0.08);
      if (ready && shown > 99.5) shown = 100;
      setProgress(shown);
      if (shown >= 100 && !doneRef.current) {
        doneRef.current = true;
        setLeaving(true); // particles burst outward first…
        burstTimer = setTimeout(() => setVisible(false), BURST_MS); // …then the overlay fades
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (burstTimer) clearTimeout(burstTimer);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <AnimatePresence
      onExitComplete={() => {
        announceIntroDone();
        onLoadingComplete();
      }}
    >
      {visible && (
        <motion.div
          key="loader"
          role="status"
          aria-live="polite"
          aria-label="Loading CodeNinjaVik"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "radial-gradient(ellipse at 50% 40%, hsl(0 35% 9%) 0%, hsl(0 0% 4%) 60%, hsl(0 0% 2%) 100%)" }}
        >
          {/* Core stage: CSS glow paints instantly (and is the no-WebGL fallback); particles fade in over it */}
          <div className="relative h-[19rem] w-[19rem] sm:h-[24rem] sm:w-[24rem]">
            <div
              className="absolute inset-0 rounded-full motion-safe:animate-[core-breathe_2.4s_ease-in-out_infinite]"
              style={{ background: "radial-gradient(circle, hsl(0 72% 51% / 0.32) 0%, hsl(0 72% 51% / 0.1) 38%, transparent 66%)" }}
              aria-hidden="true"
            />
            <LoaderParticles
              leaving={leaving}
              onFormed={() => {
                formedRef.current = true;
              }}
              className="absolute inset-0"
            />
          </div>

          {/* Brand — CSS keyframes so it flips in on first paint, before JavaScript */}
          <h1
            className="-mt-4 flex font-display text-3xl font-extrabold tracking-[0.2em] text-foreground transition-[opacity,transform] duration-300 sm:text-4xl [perspective:600px]"
            style={leaving ? { opacity: 0, transform: "translateY(-8px)" } : undefined}
            aria-hidden="true"
          >
            {BRAND.map((ch, i) => (
              <span
                key={i}
                className="inline-block origin-bottom motion-reduce:![animation:none]"
                style={{
                  color: i < 4 ? "hsl(0 80% 60%)" : undefined,
                  animation: `letter-flip 0.6s cubic-bezier(0.16,1,0.3,1) ${0.1 + i * 0.04}s both`,
                }}
              >
                {ch}
              </span>
            ))}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground" style={leaving ? { opacity: 0 } : undefined}>
            AI voice assistants for your PC and phone
          </p>

          <div className="mt-7 w-52" aria-hidden="true" style={leaving ? { opacity: 0, transition: "opacity .2s" } : undefined}>
            <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full origin-left rounded-full bg-gradient-to-r from-primary to-rose-400"
                style={
                  hydrated
                    ? { transform: `scaleX(${progress / 100})`, boxShadow: "0 0 12px hsl(0 72% 51% / 0.8)" }
                    : { animation: "loader-prefill 2.6s cubic-bezier(0.2,0.7,0.3,1) forwards", boxShadow: "0 0 12px hsl(0 72% 51% / 0.8)" }
                }
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
